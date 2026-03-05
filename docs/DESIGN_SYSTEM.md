# Design System — Kevin Hussein Tattoo Studio

> **Versão:** 1.0  
> **Última atualização:** Dezembro 2024  
> **Filosofia:** Drama controlado. Cinematográfico. Premium.

---

## 1. Paleta de Cores (Proporção 70/20/10)

### Neutros (70%) — Base do design
| Token | Hex | Uso |
|-------|-----|-----|
| `obsidian` | `#0B0B0D` | Fundo principal |
| `graphite` | `#1A1A1F` | Cards, containers |
| `graphite-light` | `#252529` | Elevação, hover |
| `bone` | `#D9D4C6` | Texto secundário |
| `bone-muted` | `#9A9590` | Texto terciário |
| `bone-faded` | `#5C5955` | Texto desabilitado |

### Acanthus / Clássicos — Detalhes premium
| Token | Hex | Uso |
|-------|-----|-----|
| `champagne` | `#C8B89A` | Ornamentos, detalhes premium |
| `champagne-light` | `#D4C8B0` | Hover em elementos champagne |
| `champagne-muted` | `rgba(200, 184, 154, 0.15)` | Backgrounds sutis |

### Roxos (20%) — Títulos e blocos-chave
| Token | Hex | Uso |
|-------|-----|-----|
| `imperial` | `#4B2F6B` | Títulos, blocos principais |
| `imperial-light` | `#5C3D7D` | Hover |
| `violet` | `#3A1D54` | Sombras, profundidade |
| `violet-deep` | `#2A1340` | Gradientes escuros |

### Neon (10%) — MICRO DETALHES APENAS
| Token | Hex | Uso |
|-------|-----|-----|
| `neon` | `#A237FF` | Hover, linha fina, ícone ativo |
| `neon-glow` | `rgba(162, 55, 255, 0.3)` | Glow sutil |
| `neon-muted` | `rgba(162, 55, 255, 0.1)` | Background hover |

#### ⚠️ Regras do Neon
- ✅ Hover em links/botões
- ✅ Linha fina (1px) de destaque
- ✅ Ícone ativo
- ✅ Sublinhado mínimo
- ❌ Nunca em blocos grandes
- ❌ Nunca como cor de fundo
- ❌ Nunca piscando/animando

---

## 2. Tipografia

### Font Stack
```css
--font-display: 'Playfair Display', 'Cormorant Garamond', Georgia, serif;
--font-body: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Hierarquia
| Elemento | Font | Weight | Uso |
|----------|------|--------|-----|
| Display (Hero) | Playfair Display | 700 | Títulos principais |
| Heading (H1-H3) | Playfair Display | 600 | Títulos de seção |
| Subheading | Montserrat | 500 | Subtítulos |
| Body | Montserrat | 400 | Texto corrido |
| UI (Botões/Menu) | Montserrat | 500 | Interface |
| Caption | Montserrat | 500 | Labels, tags |

### Escala (Mobile-First)
```
Display:  2.5rem → 3.5rem → 4.5rem
H1:       2rem → 2.5rem → 3rem
H2:       1.5rem → 1.75rem → 2rem
H3:       1.25rem → 1.375rem → 1.5rem
Body:     1rem (16px)
Small:    0.875rem (14px)
Caption:  0.75rem (12px)
```

---

## 3. Estética Acanthus

### Onde usar
- Background fantasma (5-8% opacidade)
- Marca d'água em seções premium
- Divisores sutis entre seções

### Onde NÃO usar
- ❌ Repetição tipo papel de parede
- ❌ Dentro de botões ou títulos
- ❌ Próximo ao neon (manter distância)
- ❌ Em elementos de UI

### Estilo Visual
- Vector clean moderno (linhas lisas)
- Sem textura suja
- Stroke only, nunca fill
- Opacity máxima: 8%

---

## 4. Componentes

### Botões
```
Primary:   bg-champagne text-obsidian hover:bg-champagne-light
Secondary: bg-graphite border-bone/10 text-bone hover:border-neon/50
Ghost:     text-bone hover:text-champagne
```

### Cards
```
Default:   bg-graphite border border-bone/6
Elevated:  bg-graphite-light border border-bone/8 shadow
Premium:   bg-graphite border border-champagne/20
```

### Inputs
```
Base:      bg-obsidian border border-bone/10 text-bone
Focus:     border-neon/40 ring-1 ring-neon/20
```

---

## 5. Espaçamento

### Scale (base 4px)
```
1:  0.25rem (4px)
2:  0.5rem (8px)
3:  0.75rem (12px)
4:  1rem (16px)
5:  1.25rem (20px)
6:  1.5rem (24px)
8:  2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
16: 4rem (64px)
20: 5rem (80px)
24: 6rem (96px)
```

### Seções
```
Mobile:  py-16 (64px)
Tablet:  py-20 (80px)
Desktop: py-24 (96px)
```

---

## 6. Sombras e Efeitos

### Shadows
```
sm:      0 1px 2px rgba(0, 0, 0, 0.5)
md:      0 4px 6px rgba(0, 0, 0, 0.4)
lg:      0 10px 15px rgba(0, 0, 0, 0.3)
xl:      0 20px 25px rgba(0, 0, 0, 0.25)
neon:    0 0 20px rgba(162, 55, 255, 0.3)
```

### Glassmorphism
```
glass:        bg-graphite/80 backdrop-blur-xl border border-bone/6
glass-strong: bg-graphite/90 backdrop-blur-2xl border border-bone/8
```

---

## 7. Animações

### Durações
```
fast:   150ms
normal: 250ms
slow:   400ms
```

### Easings
```
ease-out:     cubic-bezier(0.16, 1, 0.3, 1)
ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)
bounce:       cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Regras
- Animações sutis, nunca chamativas
- Nada piscando sem motivo
- Respeitar `prefers-reduced-motion`

---

## 8. Layout

### Container
```
max-width: 1200px
padding:   1rem → 1.5rem → 2rem
```

### Grid
```
Mobile:  1 coluna
Tablet:  2 colunas (gap-6)
Desktop: 12 colunas (gap-6)
```

---

## 9. Jornada do Cliente

### Fases
1. **Reunião Estratégica** — CTA principal (gratuita)
2. **Design Sob Medida** — Após aprovação
3. **Sessão de Tattoo** — Agendamento final

### Hierarquia de CTAs
- **Primário:** "Agendar Reunião" (champagne)
- **Secundário:** Links de navegação
- **Terciário:** Informações de contato

---

## 10. Checklist de Qualidade

### Visual
- [ ] Nenhum branco puro (#FFFFFF)
- [ ] Neon apenas em micro-detalhes
- [ ] Acanthus com max 8% opacity
- [ ] Contraste WCAG AA

### UX
- [ ] Touch targets 44x44px mínimo
- [ ] Focus states visíveis
- [ ] Transições 150-400ms

### Performance
- [ ] prefers-reduced-motion respeitado
- [ ] Lazy loading de imagens
- [ ] Fontes com font-display: swap
