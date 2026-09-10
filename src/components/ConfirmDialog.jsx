// Reutiliza o botão padrão nas ações da confirmação.
import Button from './Button.jsx'

// Exibe uma confirmação visual antes de uma exclusão.
export default function ConfirmDialog({ title, message, onCancel, onConfirm, saving, confirmLabel = 'Apagar', savingLabel = 'Apagando...' }) {
  // Renderiza a camada sobreposta e o conteúdo da confirmação.
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-sm rounded-lg border border-wood-200 bg-white p-5 shadow-xl">
        <h2 id="confirm-dialog-title" className="font-display font-600 text-lg text-wood-900">{title}</h2>
        <p className="mt-2 text-sm text-wood-600">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={saving}>
            {saving ? savingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
