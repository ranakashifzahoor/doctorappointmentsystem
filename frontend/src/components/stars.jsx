/** Small star rating display (value 0-5, half-stars rounded). */
const Stars = ({ value = 0, size = 'text-sm' }) => {
  const rounded = Math.round(Number(value) * 2) / 2
  return (
    <span className={`${size} tracking-tight`} title={`${Number(value).toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </span>
  )
}

export default Stars
