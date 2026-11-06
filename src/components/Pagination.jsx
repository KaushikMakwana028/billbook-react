import React from 'react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalRows = 0,
  limit = 10,
  onPageChange,
  itemName = 'records',
}) => {
  if (totalRows <= 0 || totalPages <= 1) {
    return null;
  }

  const startRecord = Math.min((currentPage - 1) * limit + 1, totalRows);
  const endRecord = Math.min(currentPage * limit, totalRows);

  // Generate page numbers with smart ellipsis window
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[var(--line)]">
      {/* Records count label */}
      <div className="text-xs text-[var(--mut)] text-center sm:text-left order-2 sm:order-1">
        Showing <b className="text-[var(--ink)] font-semibold">{startRecord}</b> to{' '}
        <b className="text-[var(--ink)] font-semibold">{endRecord}</b> of{' '}
        <b className="text-[var(--ink)] font-semibold">{totalRows}</b> {itemName}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`h-8 px-3 rounded-xl border border-[var(--line)] text-xs font-semibold flex items-center gap-1 transition-all ${
            currentPage <= 1
              ? 'opacity-40 cursor-not-allowed bg-[var(--soft)]/50 text-[var(--mut)]'
              : 'bg-[var(--card)] hover:bg-[var(--soft)] hover:text-[var(--blue)] text-[var(--ink)] shadow-sm'
          }`}
          aria-label="Previous Page"
        >
          <i className="bi bi-chevron-left text-[11px]"></i>
          <span>Prev</span>
        </button>

        {/* Desktop Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-[var(--mut)]"
                >
                  •••
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[var(--blue)] text-white shadow-sm shadow-blue-500/30'
                    : 'border border-[var(--line)] bg-[var(--card)] hover:bg-[var(--soft)] text-[var(--ink)] hover:text-[var(--blue)]'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Indicator */}
        <div className="sm:hidden px-2 text-xs font-semibold text-[var(--ink)]">
          {currentPage} / {totalPages}
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`h-8 px-3 rounded-xl border border-[var(--line)] text-xs font-semibold flex items-center gap-1 transition-all ${
            currentPage >= totalPages
              ? 'opacity-40 cursor-not-allowed bg-[var(--soft)]/50 text-[var(--mut)]'
              : 'bg-[var(--card)] hover:bg-[var(--soft)] hover:text-[var(--blue)] text-[var(--ink)] shadow-sm'
          }`}
          aria-label="Next Page"
        >
          <span>Next</span>
          <i className="bi bi-chevron-right text-[11px]"></i>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
