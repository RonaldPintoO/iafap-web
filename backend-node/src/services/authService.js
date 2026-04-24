const crypto = require('crypto');
const sql = require('mssql');
const db = require('../config/database');

const AUTHORIZED_ASESORES = new Set([
  '3152', '2005', '3005', '3117', '3093', '3007', '1618', '3065', '3075',
  '3154', '1512', '1332', '3064', '3165', '1400', '2071', '2030', '3153',
  '3118',
]);

const MAX_FAILED_ATTEMPTS = 3;
const INACTIVITY_MINUTES = 5;
const PERMANENT_LOCK_DATE = '2099-12-31T23:59:59';

function normalizeAsenum(asenum) {
  return String(asenum || '').replace(/\D/g, '').slice(0, 4);
}

function buildToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getClientIp(reqMeta = {}) {
  const forwarded = String(reqMeta.ip || '').split(',')[0].trim();
  return forwarded || 'unknown-ip';
}

function getUserAgent(reqMeta = {}) {
  return String(reqMeta.userAgent || '').trim().slice(0, 400) || 'unknown-agent';
}

function buildClientKey(reqMeta = {}) {
  const raw = `${getClientIp(reqMeta)}|${getUserAgent(reqMeta)}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

async function getPool() {
  return db.getPool();
}

async function findAuthorizedAsesor(asenum) {
  const code = normalizeAsenum(asenum);
  if (!AUTHORIZED_ASESORES.has(code)) return null;

  const pool = await getPool();
  const result = await pool
    .request()
    .input('asenum', sql.VarChar(10), code)
    .query(`
      SELECT TOP (1)
        LTRIM(RTRIM(asenum)) AS asenum,
        LTRIM(RTRIM(asenom)) AS nombre,
        LTRIM(RTRIM(aseimei)) AS aseimei
      FROM dbo.ASESORES
      WHERE LTRIM(RTRIM(asenum)) = @asenum
    `);

  return result.recordset?.[0] || null;
}

async function getClientState(clientKey) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('clientKey', sql.VarChar(64), clientKey)
    .query(`
      SELECT TOP (1)
        client_key,
        failed_attempts,
        locked_until,
        last_attempt_at,
        updated_at,
        CASE
          WHEN locked_until IS NOT NULL AND locked_until > SYSDATETIME() THEN 1
          ELSE 0
        END AS is_blocked
      FROM dbo.WEBAPP_LOGIN_CLIENTS
      WHERE client_key = @clientKey
    `);

  return result.recordset?.[0] || null;
}

async function resetClientFailures(clientKey) {
  const pool = await getPool();
  await pool
    .request()
    .input('clientKey', sql.VarChar(64), clientKey)
    .query(`
      UPDATE dbo.WEBAPP_LOGIN_CLIENTS
      SET
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = SYSDATETIME()
      WHERE client_key = @clientKey
    `);
}

async function registerClientFailure(clientKey, reqMeta = {}) {
  const pool = await getPool();
  const ip = getClientIp(reqMeta);
  const userAgent = getUserAgent(reqMeta);

  const result = await pool
    .request()
    .input('clientKey', sql.VarChar(64), clientKey)
    .input('maxAttempts', sql.Int, MAX_FAILED_ATTEMPTS)
    .input('ip', sql.VarChar(80), ip)
    .input('userAgent', sql.VarChar(sql.MAX), userAgent)
    .input('permanentLockDate', sql.DateTime2, new Date(PERMANENT_LOCK_DATE))
    .query(`
      MERGE dbo.WEBAPP_LOGIN_CLIENTS AS target
      USING (
        SELECT
          @clientKey AS client_key,
          @ip AS last_ip,
          @userAgent AS user_agent
      ) AS source
      ON target.client_key = source.client_key
      WHEN MATCHED THEN
        UPDATE SET
          failed_attempts =
            CASE
              WHEN target.locked_until IS NOT NULL AND target.locked_until <= SYSDATETIME() THEN 1
              ELSE ISNULL(target.failed_attempts, 0) + 1
            END,
          locked_until =
            CASE
              WHEN (
                CASE
                  WHEN target.locked_until IS NOT NULL AND target.locked_until <= SYSDATETIME() THEN 1
                  ELSE ISNULL(target.failed_attempts, 0) + 1
                END
              ) >= @maxAttempts
                THEN @permanentLockDate
              ELSE target.locked_until
            END,
          last_attempt_at = SYSDATETIME(),
          last_ip = source.last_ip,
          user_agent = source.user_agent,
          updated_at = SYSDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (client_key, failed_attempts, locked_until, last_attempt_at, last_ip, user_agent, created_at, updated_at)
        VALUES (
          source.client_key,
          1,
          NULL,
          SYSDATETIME(),
          source.last_ip,
          source.user_agent,
          SYSDATETIME(),
          SYSDATETIME()
        );

      SELECT TOP (1)
        client_key,
        failed_attempts,
        locked_until,
        last_attempt_at,
        updated_at,
        CASE
          WHEN locked_until IS NOT NULL AND locked_until > SYSDATETIME() THEN 1
          ELSE 0
        END AS is_blocked
      FROM dbo.WEBAPP_LOGIN_CLIENTS
      WHERE client_key = @clientKey;
    `);

  return result.recordset?.[0] || null;
}

function buildLockResponse(state) {
  return {
    ok: false,
    status: 423,
    code: 'USER_BLOCKED',
    message: 'Comuniquese con Comercial si desea desbloquear su usuario.',
    remainingSeconds: 0,
    attempts: Number(state?.failed_attempts || MAX_FAILED_ATTEMPTS),
  };
}

async function getClientLockStatus(reqMeta = {}) {
  const clientKey = buildClientKey(reqMeta);
  const clientState = await getClientState(clientKey);

  if (!clientState || Number(clientState.is_blocked || 0) !== 1) {
    return {
      blocked: false,
      remainingSeconds: 0,
      attempts: Number(clientState?.failed_attempts || 0),
    };
  }

  return {
    blocked: true,
    remainingSeconds: 0,
    attempts: Number(clientState.failed_attempts || MAX_FAILED_ATTEMPTS),
    message: 'Comuniquese con Comercial si desea desbloquear su usuario.',
  };
}

async function getAsesorSession(asenum) {
  const code = normalizeAsenum(asenum);
  const pool = await getPool();
  const result = await pool
    .request()
    .input('asenum', sql.VarChar(10), code)
    .query(`
      SELECT TOP (1)
        asenum,
        active_session_token,
        session_started_at,
        last_activity_at,
        updated_at
      FROM dbo.WEBAPP_ASESORES_AUTH
      WHERE asenum = @asenum
    `);

  return result.recordset?.[0] || null;
}

async function upsertAsesorSession({ asenum, token, lastActivityAt }) {
  const code = normalizeAsenum(asenum);
  const pool = await getPool();
  const activity = lastActivityAt ? new Date(lastActivityAt) : new Date();

  await pool
    .request()
    .input('asenum', sql.VarChar(10), code)
    .input('token', sql.VarChar(128), token)
    .input('activityAt', sql.DateTime2, activity)
    .query(`
      MERGE dbo.WEBAPP_ASESORES_AUTH AS target
      USING (SELECT @asenum AS asenum) AS source
      ON target.asenum = source.asenum
      WHEN MATCHED THEN
        UPDATE SET
          active_session_token = @token,
          session_started_at = @activityAt,
          last_activity_at = @activityAt,
          updated_at = SYSDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (asenum, active_session_token, session_started_at, last_activity_at, created_at, updated_at)
        VALUES (@asenum, @token, @activityAt, @activityAt, SYSDATETIME(), SYSDATETIME());
    `);
}

async function clearAsesorSession(asenum) {
  const code = normalizeAsenum(asenum);
  const pool = await getPool();
  await pool
    .request()
    .input('asenum', sql.VarChar(10), code)
    .query(`
      UPDATE dbo.WEBAPP_ASESORES_AUTH
      SET
        active_session_token = NULL,
        session_started_at = NULL,
        last_activity_at = NULL,
        updated_at = SYSDATETIME()
      WHERE asenum = @asenum
    `);
}

async function findSessionByToken(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;

  const pool = await getPool();
  const result = await pool
    .request()
    .input('token', sql.VarChar(128), raw)
    .input('inactivityMinutes', sql.Int, INACTIVITY_MINUTES)
    .query(`
      SELECT TOP (1)
        a.asenum,
        LTRIM(RTRIM(s.asenom)) AS nombre,
        a.active_session_token,
        a.session_started_at,
        a.last_activity_at,
        a.updated_at,
        CASE
          WHEN a.last_activity_at IS NULL THEN 1
          WHEN DATEADD(MINUTE, @inactivityMinutes, a.last_activity_at) <= SYSDATETIME() THEN 1
          ELSE 0
        END AS is_expired
      FROM dbo.WEBAPP_ASESORES_AUTH a
      INNER JOIN dbo.ASESORES s
        ON LTRIM(RTRIM(s.asenum)) = a.asenum
      WHERE a.active_session_token = @token
    `);

  return result.recordset?.[0] || null;
}

async function touchSession(token) {
  const raw = String(token || '').trim();
  if (!raw) return null;

  const pool = await getPool();
  await pool
    .request()
    .input('token', sql.VarChar(128), raw)
    .query(`
      UPDATE dbo.WEBAPP_ASESORES_AUTH
      SET
        last_activity_at = SYSDATETIME(),
        updated_at = SYSDATETIME()
      WHERE active_session_token = @token
    `);

  return findSessionByToken(raw);
}

async function hasActiveSessionInSql(asenum) {
  const code = normalizeAsenum(asenum);
  const pool = await getPool();
  const result = await pool
    .request()
    .input('asenum', sql.VarChar(10), code)
    .input('inactivityMinutes', sql.Int, INACTIVITY_MINUTES)
    .query(`
      SELECT TOP (1)
        CASE
          WHEN active_session_token IS NULL THEN 0
          WHEN last_activity_at IS NULL THEN 0
          WHEN DATEADD(MINUTE, @inactivityMinutes, last_activity_at) > SYSDATETIME() THEN 1
          ELSE 0
        END AS has_active_session
      FROM dbo.WEBAPP_ASESORES_AUTH
      WHERE asenum = @asenum
    `);

  return Number(result.recordset?.[0]?.has_active_session || 0) === 1;
}

async function appendAuthLog({ asenum = null, eventType, detail = null, reqMeta = {} }) {
  const pool = await getPool();
  await pool
    .request()
    .input('asenum', sql.VarChar(10), normalizeAsenum(asenum) || null)
    .input('eventType', sql.VarChar(40), String(eventType || '').slice(0, 40))
    .input('detail', sql.VarChar(300), detail ? String(detail).slice(0, 300) : null)
    .input('ip', sql.VarChar(80), getClientIp(reqMeta))
    .input('userAgent', sql.VarChar(sql.MAX), getUserAgent(reqMeta))
    .query(`
      INSERT INTO dbo.WEBAPP_LOGIN_LOG (
        asenum,
        event_type,
        detail,
        ip,
        user_agent,
        created_at
      )
      VALUES (
        @asenum,
        @eventType,
        @detail,
        @ip,
        @userAgent,
        SYSDATETIME()
      )
    `);
}

async function login({ asenum, reqMeta = {} }) {
  const code = normalizeAsenum(asenum);
  const clientKey = buildClientKey(reqMeta);

  const clientState = await getClientState(clientKey);
  if (clientState && Number(clientState.is_blocked || 0) === 1) {
    await appendAuthLog({
      asenum: code,
      eventType: 'LOGIN_BLOCKED',
      detail: 'Cliente bloqueado permanentemente',
      reqMeta,
    });
    return buildLockResponse(clientState);
  }

  const asesor = await findAuthorizedAsesor(code);
  if (!asesor) {
    const failureState = await registerClientFailure(clientKey, reqMeta);
    const isBlocked = Number(failureState?.is_blocked || 0) === 1;

    await appendAuthLog({
      asenum: code,
      eventType: isBlocked ? 'LOGIN_BLOCKED' : 'LOGIN_FAIL',
      detail: 'Número de asesor inválido',
      reqMeta,
    });

    if (isBlocked) {
      return buildLockResponse(failureState);
    }

    return {
      ok: false,
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Número de asesor inválido.',
      attempts: Number(failureState?.failed_attempts || 1),
      remainingSeconds: 0,
    };
  }

  await resetClientFailures(clientKey);

  const currentSession = await getAsesorSession(code);
  if (currentSession?.active_session_token) {
    const hasActiveSession = await hasActiveSessionInSql(code);

    if (hasActiveSession) {
      await appendAuthLog({
        asenum: code,
        eventType: 'LOGIN_DENIED_ACTIVE_SESSION',
        detail: 'El asesor ya tiene una sesión activa',
        reqMeta,
      });

      return {
        ok: false,
        status: 409,
        code: 'ACTIVE_SESSION_EXISTS',
        message: 'Este asesor ya tiene una sesión activa en otro dispositivo. Debe cerrar sesión allí o esperar 5 minutos de inactividad.',
      };
    }

    await clearAsesorSession(code);
  }

  const token = buildToken();
  await upsertAsesorSession({ asenum: code, token, lastActivityAt: new Date() });
  await appendAuthLog({
    asenum: code,
    eventType: 'LOGIN_OK',
    detail: 'Inicio de sesión correcto',
    reqMeta,
  });

  return {
    ok: true,
    status: 200,
    session: {
      token,
      asenum: code,
      nombre: asesor.nombre || `Asesor ${code}`,
      inactivityMinutes: INACTIVITY_MINUTES,
      expiresAt: Date.now() + INACTIVITY_MINUTES * 60 * 1000,
    },
  };
}

async function getSession(token) {
  const session = await findSessionByToken(token);
  if (!session?.active_session_token) return null;

  if (Number(session.is_expired) === 1) {
    await appendAuthLog({
      asenum: session.asenum,
      eventType: 'AUTO_LOGOUT',
      detail: 'Sesión cerrada por inactividad',
      reqMeta: {},
    });
    await clearAsesorSession(session.asenum);
    return null;
  }

  const updated = await touchSession(token);
  if (!updated) return null;

  return {
    token: updated.active_session_token,
    asenum: normalizeAsenum(updated.asenum),
    nombre: updated.nombre || `Asesor ${normalizeAsenum(updated.asenum)}`,
    inactivityMinutes: INACTIVITY_MINUTES,
    expiresAt: Date.now() + INACTIVITY_MINUTES * 60 * 1000,
  };
}

async function logout(token, reqMeta = {}) {
  const session = await findSessionByToken(token);
  if (!session) return;

  await appendAuthLog({
    asenum: session.asenum,
    eventType: 'LOGOUT',
    detail: 'Cierre de sesión manual',
    reqMeta,
  });
  await clearAsesorSession(session.asenum);
}

function getPublicSession(session) {
  if (!session) return null;
  return {
    asenum: session.asenum,
    nombre: session.nombre,
    inactivityMinutes: session.inactivityMinutes || INACTIVITY_MINUTES,
    expiresAt: session.expiresAt,
  };
}

module.exports = {
  login,
  logout,
  getSession,
  getPublicSession,
  normalizeAsenum,
  INACTIVITY_MINUTES,
  getClientLockStatus,
};