import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PlanNotificationProps {
  title: string;
  description: string;
  variant?: "default" | "success" | "warning" | "error";
  duration?: number; // in milliseconds
  onClose?: () => void;
}

export const PlanNotification: React.FC<PlanNotificationProps> = ({
  title,
  description,
  variant = "default",
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 max-w-md rounded-lg shadow-lg p-4 animate-in fade-in slide-in-from-bottom-5",
        {
          "bg-white text-black border border-gray-200": variant === "default",
          "bg-green-50 text-green-900 border border-green-200": variant === "success",
          "bg-yellow-50 text-yellow-900 border border-yellow-200": variant === "warning",
          "bg-red-50 text-red-900 border border-red-200": variant === "error",
        }
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-sm mt-1 opacity-90">{description}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
    </div>
  );
};

// Context and Provider for managing notifications
type NotificationContextType = {
  showNotification: (props: Omit<PlanNotificationProps, "onClose">) => void;
};

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const PlanNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<(PlanNotificationProps & { id: string })[]>([]);

  const showNotification = (props: Omit<PlanNotificationProps, "onClose">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...props, id, onClose: () => removeNotification(id) }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <PlanNotification key={notification.id} {...notification} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const usePlanNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("usePlanNotification must be used within a PlanNotificationProvider");
  }
  return context;
};