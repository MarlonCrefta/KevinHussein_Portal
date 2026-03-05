import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-charcoal">
      <div className="relative z-10">
        <Header />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <Outlet />
        </motion.main>
        <Footer />
      </div>
    </div>
  )
}
