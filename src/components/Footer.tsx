import { Instagram, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-16 sm:py-20 px-6 sm:px-8 lg:px-12 bg-obsidian border-t border-bone/6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12">
          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img 
                src="/LOGO SEM FUNDO.png" 
                alt="Kevin Hussein" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-bone font-medium text-lg">Kevin Hussein</span>
            </Link>
            <p className="text-bone-muted text-sm leading-relaxed">
              Arte autoral e exclusiva. Cada traço carrega identidade.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-12">
            {/* Location */}
            <div>
              <h4 className="text-bone-muted text-xs font-medium uppercase tracking-wider mb-4">
                Localização
              </h4>
              <p className="text-bone-muted text-sm leading-relaxed">
                Curitiba, PR<br />
                Cidade Industrial
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-bone-muted text-xs font-medium uppercase tracking-wider mb-4">
                Contato
              </h4>
              <div className="space-y-3">
                <a 
                  href="https://wa.me/5541996481275" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-bone-muted hover:text-neon transition-colors duration-200 text-sm"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
                <a 
                  href="https://instagram.com/kevinhusseintattoo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-bone-muted hover:text-neon transition-colors duration-200 text-sm"
                >
                  <Instagram size={14} />
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-bone/6 text-center">
          <p className="text-bone-faded text-xs">
            © {new Date().getFullYear()} Kevin Hussein Tattoo
          </p>
        </div>
      </div>
    </footer>
  )
}
