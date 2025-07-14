import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertTriangle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const colors = {
  success: 'border-green-300 bg-green-50',
  error: 'border-red-300 bg-red-50',
  info: 'border-blue-300 bg-blue-50',
};

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Attiva l'animazione di entrata

    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // La notifica scompare dopo 5 secondi

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false); // Attiva l'animazione di uscita
    setTimeout(onClose, 300); // Aspetta la fine dell'animazione per rimuovere il componente
  };

  return (
    <div
      className={`fixed bottom-5 right-5 w-full max-w-sm p-4 rounded-lg border-l-4 shadow-lg transition-all duration-300 ease-in-out ${colors[type]} ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium text-gray-900">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={handleClose} className="inline-flex text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};