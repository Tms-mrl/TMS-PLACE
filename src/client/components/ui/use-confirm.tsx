import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from './alert-dialog';

type ConfirmOptions = { title?: string; confirmLabel?: string; cancelLabel?: string; destructive?: boolean };
type ConfirmFn = (message: string, opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Reemplazo de confirm() nativo: mismo uso (`if (!(await confirm('¿Eliminar X?'))) return;`),
 *  pero con el diálogo propio de la app (no cierra clickeando afuera). */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm() requiere <ConfirmProvider> en un ancestro');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; opts: ConfirmOptions } | null>(null);
  const resolver = useRef<((v: boolean) => void) | undefined>(undefined);

  const confirm = useCallback<ConfirmFn>((message, opts = {}) => {
    setState({ message, opts });
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  function close(result: boolean) {
    setState(null);
    resolver.current?.(result);
    resolver.current = undefined;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={!!state} onOpenChange={(open) => { if (!open) close(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state?.opts.title || 'Confirmar'}</AlertDialogTitle>
            <AlertDialogDescription>{state?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => close(false)}>{state?.opts.cancelLabel || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => close(true)}
              className={state?.opts.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
            >
              {state?.opts.confirmLabel || 'Aceptar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
