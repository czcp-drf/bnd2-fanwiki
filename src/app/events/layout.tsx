import EventsQueryProvider from './EventsQueryProvider'

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsQueryProvider>{children}</EventsQueryProvider>
}
