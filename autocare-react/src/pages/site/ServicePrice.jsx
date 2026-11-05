import useApi from '../../useApi.js'
import { nu } from '../../data/store.js'

// The "from Nu. ..." price on a service detail page, read from MySQL.
// Used like:  <ServicePrice slug="brake-repair" />
export default function ServicePrice({ slug }) {
  const { data } = useApi('/content/services/' + slug)
  return <p className="acp-service-price mb-3">{data ? 'from ' + nu(data.price) : ' '}</p>
}
