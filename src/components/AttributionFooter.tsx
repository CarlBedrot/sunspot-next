export function AttributionFooter() {
  return (
    <footer className="attribution-footer">
      Map data &copy;{' '}
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
        OpenStreetMap contributors
      </a>{' '}
      (ODbL). Weather by{' '}
      <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
        Open-Meteo
      </a>{' '}
      and{' '}
      <a href="https://www.dmi.dk/" target="_blank" rel="noreferrer">
        DMI
      </a>{' '}
      (CC BY 4.0). Shadows are an approximation, not a precision model —
      building height data is often incomplete.
    </footer>
  )
}
