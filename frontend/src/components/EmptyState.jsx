export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <p className="text-zinc-300 font-medium">{title}</p>
        {description && <p className="text-zinc-500 text-sm mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}
