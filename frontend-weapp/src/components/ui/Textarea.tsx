import { Textarea as TaroTextarea } from '@tarojs/components'
import { TextareaProps as TaroTextareaProps } from '@tarojs/components/types/Textarea'
import './Textarea.scss'

interface TextareaProps extends TaroTextareaProps {
  className?: string
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <TaroTextarea
      className={`ui-textarea ${className}`}
      {...props}
    />
  )
}