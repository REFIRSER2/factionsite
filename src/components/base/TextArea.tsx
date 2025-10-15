import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-yellow-400 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 bg-gray-900/50 border border-yellow-400/30 rounded-lg
            text-white placeholder-gray-400 text-sm resize-none min-h-[120px]
            focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50
            transition-all duration-200
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
