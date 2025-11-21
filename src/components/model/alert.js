import { CheckCircle, XCircle } from 'lucide-react';

export function AlertModal({ show, onClose, type, message }) {
    if (!show) return null;

    return (
        <dialog className="modal modal-open modal-bottom sm:modal-middle">
            <div className="modal-box relative">
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>

                <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-4">
                    <div className={`p-3 rounded-full ${type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {type === 'success' ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-bold text-lg">
                            {type === 'success' ? 'Thành công' : 'Thông báo lỗi'}
                        </h3>
                        <p className="py-2 text-base-content/70">{message}</p>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn" onClick={onClose}>Đóng</button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}
