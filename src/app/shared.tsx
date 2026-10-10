import {
  useEffect,
  useRef,
  useState,
  useId,
  cloneElement,
  type ReactElement,
  type ReactNode,
  type ComponentProps,
} from "react";
import { Bug, ClipboardList, X, Eye, EyeOff } from "lucide-react";
import { api } from "./api";
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Bug size={22} />
      </span>
      <div>
        <strong>Blue Bug</strong>
        <small>Operations</small>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children as ReactElement<{ id: string }>, { id })}
    </div>
  );
}

export function PasswordInput(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-controls={props.id}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function ErrorLine({ message }: { message: string }) {
  return message ? (
    <p role="alert" className="error">
      {message}
    </p>
  ) : null;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <ClipboardList size={30} />
      <h3>No records yet</h3>
      <p>{children}</p>
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge ${status.toLowerCase().replaceAll(" ", "-")}`}>
      {status}
    </span>
  );
}

export function Drawer({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onCancel={close}
    >
      <header>
        <div>
          <small>BLUE BUG OPERATIONS</small>
          <h2 id="drawer-title">{title}</h2>
        </div>
        <button
          type="button"
          className="icon secondary"
          aria-label="Close form"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}

export function useData<T>(path: string | null, revision = 0) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    if (previousPath.current !== path) setData(undefined);
    previousPath.current = path;
    setError("");
    if (!path) return;
    setLoading(true);
    api<T>(path)
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, error, loading };
}

export function Pager({
  page,
  total,
  limit,
  change,
}: {
  page: number;
  total: number;
  limit: number;
  change: (p: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {total} records · Page {page} of {Math.max(1, Math.ceil(total / limit))}
      </span>
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => change(page - 1)}
      >
        Previous
      </button>
      <button
        className="secondary"
        disabled={page * limit >= total}
        onClick={() => change(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
