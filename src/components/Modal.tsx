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

// 全屏弹窗：标题固定顶部 + 内容独立滚动 + footer 钉在屏幕最底部。
// 全部用内联样式，不依赖任何 CSS 类，免疫缓存/构建差异，保证各浏览器一致。
// 全屏布局下 footer 位于 flex 列最底部 = 屏幕底部，物理上不可能被挤出可视区。
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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#fff',
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          // 占满剩余高度（flex 列 + stretch），形成全屏/近全屏弹窗
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* 标题栏：固定顶部 */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 12px',
            borderBottom: '1px solid #f5f5f5',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1f2937', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <X size={18} color="#6b7280" />
          </button>
        </div>

        {/* 内容区：独立滚动 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: '16px 20px',
            paddingBottom: footer ? 16 : 'calc(20px + env(safe-area-inset-bottom))',
          }}
        >
          {children}
        </div>

        {/* 底部操作区：钉在弹窗最底部 = 屏幕底部，始终可见可点 */}
        {footer && (
          <div
            style={{
              flexShrink: 0,
              padding: '12px 20px calc(12px + env(safe-area-inset-bottom))',
              borderTop: '1px solid #f5f5f5',
              background: '#fff',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
