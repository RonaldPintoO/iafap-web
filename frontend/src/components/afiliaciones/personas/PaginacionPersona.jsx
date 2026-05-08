export default function Pagination({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
  onGoToPage,
}) {
  if (!totalPages || totalPages <= 1) return null;

  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  return (
    <div className="afi-pagination">
      <button
        className="afi-pagination__btn"
        type="button"
        onClick={onPrev}
        disabled={loading || page <= 1}
      >
        Anterior
      </button>

      <div className="afi-pagination__pages">
        {start > 1 && (
          <>
            <button
              className={`afi-pagination__page ${page === 1 ? "is-active" : ""}`}
              type="button"
              onClick={() => onGoToPage(1)}
              disabled={loading}
            >
              1
            </button>
            {start > 2 && <span className="afi-pagination__dots">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`afi-pagination__page ${page === p ? "is-active" : ""}`}
            type="button"
            onClick={() => onGoToPage(p)}
            disabled={loading}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="afi-pagination__dots">...</span>
            )}
            <button
              className={`afi-pagination__page ${
                page === totalPages ? "is-active" : ""
              }`}
              type="button"
              onClick={() => onGoToPage(totalPages)}
              disabled={loading}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="afi-pagination__btn"
        type="button"
        onClick={onNext}
        disabled={loading || page >= totalPages}
      >
        Siguiente
      </button>
    </div>
  );
}
