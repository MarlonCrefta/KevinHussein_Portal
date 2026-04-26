import { ArrowRight, Instagram, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-16 sm:py-20 px-6 sm:px-8 lg:px-12 bg-obsidian border-t border-bone/6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
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
                className="flex items-center gap-3 text-bone-muted hover:text-[#C8B89A] transition-colors duration-200 text-sm"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
              <a
                href="https://instagram.com/kevinhusseintattoo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-bone-muted hover:text-[#C8B89A] transition-colors duration-200 text-sm"
              >
                <Instagram size={14} />
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* CTA + Copyright */}
        <div className="mt-8 pt-6 border-t border-bone/10 text-center">
          <div className="mb-6">
            <p className="text-bone-muted text-sm mb-3">Pronto para começar seu projeto?</p>
            <Link
              to="/agendar"
              className="btn btn-primary btn-md"
            >
              Agendar reunião gratuita
              <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-bone-faded text-xs">
            © {new Date().getFullYear()} Kevin Hussein Tattoo
          </p>
        </div>
      </div>
    </footer>
  )
}
