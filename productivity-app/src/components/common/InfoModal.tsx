import React from 'react';

interface InfoModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  content: string; // HTML allowed
}

const InfoModal: React.FC<InfoModalProps> = ({ show, onClose, title, content }) => {
  if (!show) return null;
  return (
    <>
      <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
      <div className="modal show d-block" tabIndex={-1} style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoModal; 