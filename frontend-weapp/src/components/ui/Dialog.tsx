import { View, Text } from '@tarojs/components'
import { ReactNode, useState, createContext, useContext } from 'react'
import './Dialog.scss'

interface DialogContextProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined)

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = useState(open || false)
  
  // 更新状态时调用回调
  const handleSetIsOpen = (newIsOpen: boolean) => {
    setIsOpen(newIsOpen)
    if (onOpenChange) {
      onOpenChange(newIsOpen)
    }
  }
  
  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen: handleSetIsOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

interface DialogTriggerProps {
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function DialogTrigger({ className = '', children, onClick }: DialogTriggerProps) {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('DialogTrigger must be used within Dialog')
  }
  
  const handleClick = () => {
    context.setIsOpen(true)
    if (onClick) onClick()
  }
  
  return (
    <View className={className} onClick={handleClick}>
      {children}
    </View>
  )
}

interface DialogContentProps {
  className?: string
  children: ReactNode
}

export function DialogContent({ className = '', children }: DialogContentProps) {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('DialogContent must be used within Dialog')
  }
  
  const { isOpen, setIsOpen } = context
  
  if (!isOpen) return null
  
  const handleClose = () => {
    setIsOpen(false)
  }
  
  return (
    <View className="ui-dialog-overlay" onClick={handleClose}>
      <View className={`ui-dialog-content ${className}`} onClick={(e) => e.stopPropagation()}>
        {children}
        <View className="ui-dialog-close" onClick={handleClose}>
          <Text>×</Text>
        </View>
      </View>
    </View>
  )
}

interface DialogHeaderProps {
  className?: string
  children: ReactNode
}

export function DialogHeader({ className = '', children }: DialogHeaderProps) {
  return (
    <View className={`ui-dialog-header ${className}`}>
      {children}
    </View>
  )
}

interface DialogTitleProps {
  className?: string
  children: ReactNode
}

export function DialogTitle({ className = '', children }: DialogTitleProps) {
  return (
    <Text className={`ui-dialog-title ${className}`}>
      {children}
    </Text>
  )
}

interface DialogDescriptionProps {
  className?: string
  children: ReactNode
}

export function DialogDescription({ className = '', children }: DialogDescriptionProps) {
  return (
    <Text className={`ui-dialog-description ${className}`}>
      {children}
    </Text>
  )
}