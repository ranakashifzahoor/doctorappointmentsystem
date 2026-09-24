/** Shows an image when available, otherwise a clean initials circle. */
const Avatar = ({ src, name = '?', className = 'w-12 h-12 text-base' }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`${className} rounded-full object-cover bg-indigo-50 border border-gray-200`}
        onError={(e) => {
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex')
        }}
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
    <div
      className={`${className} rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 font-semibold flex items-center justify-center border border-indigo-100`}
    >
      {initials || '?'}
    </div>
  )
}

export default Avatar
