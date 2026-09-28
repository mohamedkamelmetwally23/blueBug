interface Props { page: number; totalPages: number; onPageChange: (page: number) => void; }
export function TaskPagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  return <nav className="task-pagination" aria-label="Task pages" onClick={(event) => event.stopPropagation()}><button disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button><div>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button aria-current={number === page ? "page" : undefined} className={number === page ? "active" : ""} key={number} onClick={() => onPageChange(number)}>{number}</button>)}</div><button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button></nav>;
}
