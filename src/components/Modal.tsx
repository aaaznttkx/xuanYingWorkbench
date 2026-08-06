import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 固定在弹窗底部的操作区（如保存按钮），不随内容滚动，始终可见可点 */
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // 关键布局用内联样式：内联样式在 JS bundle 里，不受独立 CSS 文件缓存影响，保证各浏览器一致生效。
  // maxHeight 用 85vh（所有浏览器支持）；flex 列布局让标题固定、内容滚动、footer 固定底部。
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-[420px] animate-slide-up"
        style={{
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 标题栏：固定顶部，不随内容滚动 */}
        <div
          className="flex items-center justify-between p-5 pb-3 border-b border-gray-50"
          style={{ flexShrink: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        {/* 内容区：独立滚动。minHeight:0 让 flex 子项可收缩，overflowY:auto 才会生效 */}
        <div
          className="px-5 pt-4"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: footer ? '1rem' : 'calc(1.25rem + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>
        {/* 底部操作区：固定底部，主操作按钮始终可见可点，带安全区避免被 home indicator 遮挡 */}
        {footer && (
          <div
            className="px-5 pt-3 border-t border-gray-50 bg-white"
            style={{ flexShrink: 0, paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
