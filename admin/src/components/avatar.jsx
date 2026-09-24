const Avatar = ({ src, name = '?', className = 'w-10 h-10 text-sm' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`${className} rounded-full object-cover bg-indigo-50 border border-gray-200`}
      />
    )
  }
  const initials = name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  return (
    <div className={`${className} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center border border-indigo-100`}>
      {initials || '?'}
    </div>
  )
}

export default Avatar
