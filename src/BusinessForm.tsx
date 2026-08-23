'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import {
  deleteBusinessAsset,
  fetchBusinessAssetFile,
  fetchBusinessProfile,
  generateBusinessSummary,
  queueBusinessInsights,
  updateBusinessProfile,
  uploadBusinessAsset,
} from './api'
import { ApiError } from './http'
import { Panel } from './Panel'
import type { BusinessAsset, BusinessProfile, BusinessProfileUpdate } from './types'
import {
  WizardAlertIcon,
  WizardArrowLeftIcon,
  WizardArrowRightIcon,
  WizardBrandFacebookIcon,
  WizardBrandInstagramIcon,
  WizardBrandLinkedinIcon,
  WizardBrandPinterestIcon,
  WizardBrandTelegramIcon,
  WizardBrandThreadsIcon,
  WizardBrandTiktokIcon,
  WizardBrandXIcon,
  WizardBrandYoutubeIcon,
  WizardBriefcaseIcon,
  WizardBuildingIcon,
  WizardBuildingStoreIcon,
  WizardCalendarIcon,
  WizardCategoryIcon,
  WizardChartIcon,
  WizardCheckCircleIcon,
  WizardCpuIcon,
  WizardCrownIcon,
  WizardFileIcon,
  WizardFlagIcon,
  WizardInfoIcon,
  WizardLanguageIcon,
  WizardMailIcon,
  WizardMailboxIcon,
  WizardMapPinIcon,
  WizardPhoneIcon,
  WizardPhotoIcon,
  WizardPuzzleIcon,
  WizardQuoteIcon,
  WizardReportIcon,
  WizardSendIcon,
  WizardShareIcon,
  WizardUserCheckIcon,
  WizardUserIcon,
  WizardUsersIcon,
  WizardWhatsAppIcon,
  WizardWorldIcon,
} from './BusinessWizardIcons'

const inputClass =
  'w-full rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[var(--accent)]'

const LANGUAGES = ['Catalán', 'Español', 'Francés', 'Inglés', 'Italiano', 'Portugués']

const STEPS = [
  { id: 1, label: 'Datos del negocio', icon: WizardBuildingStoreIcon },
  { id: 2, label: 'Información personal', icon: WizardUserIcon },
  { id: 3, label: 'Dirección', icon: WizardMapPinIcon },
  { id: 4, label: 'Redes sociales', icon: WizardShareIcon },
  { id: 5, label: 'Desafío', icon: WizardPuzzleIcon },
  { id: 6, label: 'Revisar y enviar', icon: WizardCheckCircleIcon },
] as const

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function Field({
  label,
  icon,
  children,
  className = '',
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 flex items-center gap-1.5 font-medium text-[var(--muted)]">
        {icon}
        {label}
      </span>
      {children}
    </label>
  )
}

function insightNumber(value: unknown): string | null {
  return typeof value === 'number' ? value.toLocaleString('es-ES') : null
}

function industryTotal(value: unknown): number {
  if (!value || typeof value !== 'object') {
    return 0
  }

  return Object.values(value as Record<string, unknown>).reduce<number>((sum, item) => {
    return sum + (typeof item === 'number' ? item : 0)
  }, 0)
}

function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return escaped
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br />')
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] p-4">
      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-semibold sm:text-2xl">{value}</p>
    </div>
  )
}

function AiLoader({ subtitle }: { subtitle: string }) {
  return (
    <div className="business-wizard__loader">
      <div className="business-wizard__loader-core">
        <span />
        <span />
        <span />
        <WizardCpuIcon className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold">El asistente está generando tu informe</p>
      <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
    </div>
  )
}

function LogoSlot({
  asset,
  pending,
  onUpload,
  onRemove,
}: {
  asset: BusinessAsset | null
  pending?: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const [src, setSrc] = useState<string | null>(asset?.data_url ?? null)

  useEffect(() => {
    if (!asset) {
      setSrc(null)
      return
    }
    if (asset.data_url) {
      setSrc(asset.data_url)
      return
    }

    let active = true
    let objectUrl: string | null = null
    void fetchBusinessAssetFile(asset.path, asset.original_name)
      .then((file) => {
        objectUrl = URL.createObjectURL(file)
        if (active) {
          setSrc(objectUrl)
        }
      })
      .catch(() => {
        if (active) {
          setSrc(null)
        }
      })

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [asset])

  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--muted)]">
        <WizardPhotoIcon className="h-4 w-4" />
        Logo
      </span>
      <label className="business-wizard__logo relative grid cursor-pointer place-items-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--chip)]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Logo" className="h-full w-full object-contain" />
        ) : (
          <span className="px-2 text-center text-xs text-[var(--muted)]">Arrastrá o clic</span>
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              onUpload(file)
            }
            event.target.value = ''
          }}
        />
      </label>
      {asset && (
        <button
          type="button"
          disabled={pending}
          onClick={onRemove}
          className="mt-2 text-xs text-[var(--danger)] disabled:opacity-60"
        >
          Quitar logo
        </button>
      )}
    </div>
  )
}

function Nav({
  step,
  onPrev,
  onNext,
  nextLabel = 'Siguiente',
  nextDisabled,
}: {
  step: number
  onPrev: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div className="flex justify-between gap-3 pt-2">
      <button
        type="button"
        disabled={step === 1}
        onClick={onPrev}
        className="inline-flex items-center gap-1.5 rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm disabled:opacity-40"
      >
        <WizardArrowLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>
      <button
        type="button"
        disabled={nextDisabled}
        onClick={onNext}
        className="inline-flex items-center gap-1.5 rounded-2xl bg-[var(--cta)] px-4 py-2.5 text-sm font-semibold text-[var(--cta-text)] disabled:opacity-60"
      >
        <span className="hidden sm:inline">{nextLabel}</span>
        {nextLabel === 'Siguiente' ? (
          <WizardArrowRightIcon className="h-4 w-4" />
        ) : (
          <WizardSendIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

function WizardFields({
  initial,
  panelClassName,
}: {
  initial: BusinessProfile
  panelClassName: string
}) {
  const queryClient = useQueryClient()
  const profileQuery = useQuery({
    queryKey: ['business-profile'],
    queryFn: fetchBusinessProfile,
    initialData: initial,
    refetchInterval: (query) => (query.state.data?.insights_loading ? 3000 : false),
  })
  const profile = profileQuery.data ?? initial
  const [step, setStep] = useState(1)
  const [name, setName] = useState(initial.business_name ?? '')
  const [industry, setIndustry] = useState(initial.business_industry ?? '')
  const [description, setDescription] = useState(initial.business_description ?? '')
  const [tagline, setTagline] = useState(initial.business_tagline ?? '')
  const [phone, setPhone] = useState(initial.business_phone ?? '')
  const [whatsapp, setWhatsapp] = useState(initial.business_whatsapp ?? '')
  const [website, setWebsite] = useState(initial.business_website ?? '')
  const [email, setEmail] = useState(initial.business_email ?? '')
  const [firstName, setFirstName] = useState(initial.first_name ?? '')
  const [lastName, setLastName] = useState(initial.last_name ?? '')
  const [birthDate, setBirthDate] = useState(initial.birth_date ?? '')
  const [birthTime, setBirthTime] = useState(initial.birth_time ?? '')
  const [contactEmail, setContactEmail] = useState(initial.contact_email ?? '')
  const [country, setCountry] = useState(initial.country ?? '')
  const [language, setLanguage] = useState(initial.language ?? '')
  const [address, setAddress] = useState(initial.address ?? '')
  const [landmark, setLandmark] = useState(initial.landmark ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [pincode, setPincode] = useState(initial.pincode ?? '')
  const [twitter, setTwitter] = useState(initial.twitter ?? '')
  const [facebook, setFacebook] = useState(initial.facebook ?? '')
  const [instagram, setInstagram] = useState(initial.instagram ?? '')
  const [linkedin, setLinkedin] = useState(initial.linkedin ?? '')
  const [youtube, setYoutube] = useState(initial.youtube ?? '')
  const [tiktok, setTiktok] = useState(initial.tiktok ?? '')
  const [whatsappUrl, setWhatsappUrl] = useState(initial.whatsapp_url ?? '')
  const [telegram, setTelegram] = useState(initial.telegram ?? '')
  const [pinterest, setPinterest] = useState(initial.pinterest ?? '')
  const [threads, setThreads] = useState(initial.threads ?? '')
  const [challenge, setChallenge] = useState(initial.business_challenge ?? '')
  const [deepen, setDeepen] = useState(initial.wants_to_deepen ?? '')

  const payload = (): BusinessProfileUpdate => ({
    business_name: emptyToNull(name),
    business_industry: emptyToNull(industry),
    business_description: emptyToNull(description),
    business_tagline: emptyToNull(tagline),
    business_phone: emptyToNull(phone),
    business_whatsapp: emptyToNull(whatsapp),
    business_website: emptyToNull(website),
    business_email: emptyToNull(email),
    first_name: emptyToNull(firstName),
    last_name: emptyToNull(lastName),
    birth_date: emptyToNull(birthDate),
    birth_time: emptyToNull(birthTime),
    contact_email: emptyToNull(contactEmail),
    country: emptyToNull(country),
    language: emptyToNull(language),
    address: emptyToNull(address),
    landmark: emptyToNull(landmark),
    city: emptyToNull(city),
    pincode: emptyToNull(pincode),
    twitter: emptyToNull(twitter),
    facebook: emptyToNull(facebook),
    instagram: emptyToNull(instagram),
    linkedin: emptyToNull(linkedin),
    youtube: emptyToNull(youtube),
    tiktok: emptyToNull(tiktok),
    whatsapp_url: emptyToNull(whatsappUrl),
    telegram: emptyToNull(telegram),
    pinterest: emptyToNull(pinterest),
    threads: emptyToNull(threads),
    business_challenge: emptyToNull(challenge),
    wants_to_deepen: emptyToNull(deepen),
  })

  const save = useMutation({
    mutationFn: (body: BusinessProfileUpdate) => updateBusinessProfile(body),
    onSuccess: (data) => {
      queryClient.setQueryData(['business-profile'], data)
    },
  })

  const upload = useMutation({
    mutationFn: (file: File) => uploadBusinessAsset('logo', file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['business-profile'] })
    },
  })

  const remove = useMutation({
    mutationFn: (path: string) => deleteBusinessAsset(path),
    onSuccess: (data) => {
      queryClient.setQueryData(['business-profile'], data)
    },
  })

  const summary = useMutation({
    mutationFn: async () => {
      await updateBusinessProfile(payload())
      return generateBusinessSummary()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['business-profile'], data)
    },
  })

  const insights = useMutation({
    mutationFn: queueBusinessInsights,
    onSuccess: (data) => {
      queryClient.setQueryData(['business-profile'], data)
    },
  })

  async function persistAndGo(next: number) {
    const data = await save.mutateAsync(payload())
    queryClient.setQueryData(['business-profile'], data)
    setStep(next)
  }

  const canLoadInsights = Boolean(industry.trim() && description.trim() && tagline.trim())
  const hasReport = Boolean(
    profile.insights && typeof profile.insights.potential_clients_summary === 'string',
  )
  const actionError = save.error ?? upload.error ?? remove.error ?? summary.error ?? insights.error

  return (
    <>
      <nav className="business-wizard__steps" aria-label="Pasos de configuración">
        {STEPS.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={item.id} className="contents">
              {index > 0 && (
                <span
                  className={['business-wizard__line', step > index ? 'is-done' : ''].join(' ')}
                  aria-hidden
                />
              )}
              <button
                type="button"
                onClick={() => void persistAndGo(item.id)}
                className={[
                  'business-wizard__step',
                  step === item.id ? 'is-active' : '',
                  step > item.id ? 'is-done' : '',
                ].join(' ')}
              >
                <span className="business-wizard__icon">
                  <Icon />
                </span>
                <span className="business-wizard__label">{item.label}</span>
              </button>
            </div>
          )
        })}
      </nav>

      <Panel className={panelClassName}>
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Datos del negocio</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Nombre, sector, ubicación, logo y descripción de tu negocio.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del negocio (*)" icon={<WizardBuildingStoreIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre de tu empresa o marca"
              />
            </Field>
            <Field label="Sector (*)" icon={<WizardCategoryIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                placeholder="ej. Tecnología, Retail, Servicios"
              />
            </Field>
            <div className="flex items-start gap-3 sm:col-span-2">
              <LogoSlot
                asset={profile.logo}
                pending={remove.isPending}
                onUpload={(file) => upload.mutate(file)}
                onRemove={() => profile.logo && remove.mutate(profile.logo.path)}
              />
              <Field
                label="Descripción (*)"
                className="min-w-0 flex-1"
                icon={<WizardFileIcon className="h-4 w-4" />}
              >
                <textarea
                  className={`${inputClass} min-h-[120px]`}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="¿Qué hace tu negocio? ¿A quién va dirigido?"
                />
              </Field>
            </div>
            <Field
              label="Propuesta de valor (*)"
              className="sm:col-span-2"
              icon={<WizardQuoteIcon className="h-4 w-4" />}
            >
              <input
                className={inputClass}
                value={tagline}
                onChange={(event) => setTagline(event.target.value)}
                placeholder="Frase corta que defina tu negocio"
              />
            </Field>
            <Field label="Teléfono" icon={<WizardPhoneIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+34 600 000 000"
              />
            </Field>
            <Field label="WhatsApp" icon={<WizardWhatsAppIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="+34 600 000 000"
              />
            </Field>
            <Field label="Página web" icon={<WizardWorldIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://www.ejemplo.com"
              />
            </Field>
            <Field label="Email del negocio" icon={<WizardMailIcon className="h-4 w-4" />}>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="contacto@empresa.com"
              />
            </Field>
          </div>
          <Nav step={1} onPrev={() => setStep(1)} onNext={() => void persistAndGo(2)} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Información personal</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Introduce tu información personal. Cuanto más te conozcamos, más te podremos ayudar
              con la gestión de tus clientes.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                className={inputClass}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Nombre"
              />
            </Field>
            <Field label="Apellidos">
              <input
                className={inputClass}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Apellidos"
              />
            </Field>
            <Field label="Fecha de nacimiento" icon={<WizardCalendarIcon className="h-4 w-4" />}>
              <input
                type="date"
                className={inputClass}
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </Field>
            <Field label="Hora de nacimiento">
              <input
                type="time"
                className={inputClass}
                value={birthTime}
                onChange={(event) => setBirthTime(event.target.value)}
              />
            </Field>
            <Field label="Email de contacto" icon={<WizardMailIcon className="h-4 w-4" />}>
              <input
                type="email"
                className={inputClass}
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="tu@email.com"
              />
            </Field>
            <Field label="WhatsApp" icon={<WizardWhatsAppIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="+34 600 000 000"
              />
            </Field>
            <Field label="País" icon={<WizardWorldIcon className="h-4 w-4" />}>
              <select className={inputClass} value={country} onChange={(event) => setCountry(event.target.value)}>
                <option value="">Seleccionar país</option>
                {(profile.countries ?? []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Idioma" icon={<WizardLanguageIcon className="h-4 w-4" />}>
              <select className={inputClass} value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="">Seleccionar idioma</option>
                {LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Nav step={2} onPrev={() => void persistAndGo(1)} onNext={() => void persistAndGo(3)} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Dirección</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Introduce tu dirección (no aplica para negocios digitales).
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dirección" icon={<WizardMapPinIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Calle, número, piso"
              />
            </Field>
            <Field label="Punto de referencia" icon={<WizardFlagIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
                placeholder="Cerca de..."
              />
            </Field>
            <Field label="Ciudad, país" icon={<WizardBuildingIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="Madrid, España"
              />
            </Field>
            <Field label="Código postal" icon={<WizardMailboxIcon className="h-4 w-4" />}>
              <input
                className={inputClass}
                value={pincode}
                onChange={(event) => setPincode(event.target.value)}
                placeholder="28001"
              />
            </Field>
          </div>
          <Nav step={3} onPrev={() => void persistAndGo(2)} onNext={() => void persistAndGo(4)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Redes sociales</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">Introduce los enlaces a tus redes sociales.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="X (Twitter)" icon={<WizardBrandXIcon className="h-4 w-4" />}>
              <input className={inputClass} value={twitter} onChange={(event) => setTwitter(event.target.value)} placeholder="https://x.com/..." />
            </Field>
            <Field label="Facebook" icon={<WizardBrandFacebookIcon className="h-4 w-4 text-sky-600" />}>
              <input className={inputClass} value={facebook} onChange={(event) => setFacebook(event.target.value)} placeholder="https://facebook.com/..." />
            </Field>
            <Field label="Instagram" icon={<WizardBrandInstagramIcon className="h-4 w-4 text-rose-500" />}>
              <input className={inputClass} value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="LinkedIn" icon={<WizardBrandLinkedinIcon className="h-4 w-4 text-sky-700" />}>
              <input className={inputClass} value={linkedin} onChange={(event) => setLinkedin(event.target.value)} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="YouTube" icon={<WizardBrandYoutubeIcon className="h-4 w-4 text-rose-600" />}>
              <input className={inputClass} value={youtube} onChange={(event) => setYoutube(event.target.value)} placeholder="https://youtube.com/..." />
            </Field>
            <Field label="TikTok" icon={<WizardBrandTiktokIcon className="h-4 w-4" />}>
              <input className={inputClass} value={tiktok} onChange={(event) => setTiktok(event.target.value)} placeholder="https://tiktok.com/@" />
            </Field>
            <Field label="WhatsApp" icon={<WizardWhatsAppIcon className="h-4 w-4 text-emerald-600" />}>
              <input className={inputClass} value={whatsappUrl} onChange={(event) => setWhatsappUrl(event.target.value)} placeholder="https://wa.me/..." />
            </Field>
            <Field label="Telegram" icon={<WizardBrandTelegramIcon className="h-4 w-4 text-sky-500" />}>
              <input className={inputClass} value={telegram} onChange={(event) => setTelegram(event.target.value)} placeholder="https://t.me/..." />
            </Field>
            <Field label="Pinterest" icon={<WizardBrandPinterestIcon className="h-4 w-4 text-rose-600" />}>
              <input className={inputClass} value={pinterest} onChange={(event) => setPinterest(event.target.value)} placeholder="https://pinterest.com/..." />
            </Field>
            <Field label="Threads" icon={<WizardBrandThreadsIcon className="h-4 w-4" />}>
              <input className={inputClass} value={threads} onChange={(event) => setThreads(event.target.value)} placeholder="https://threads.net/@" />
            </Field>
          </div>
          <Nav step={4} onPrev={() => void persistAndGo(3)} onNext={() => void persistAndGo(5)} />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Desafío de tu negocio</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Describe el reto o la situación actual. El Asistente AI generará un resumen conciso de
              lo que necesitás para mejorar.
            </p>
          </div>
          <Field label="Desafío" icon={<WizardPuzzleIcon className="h-4 w-4" />}>
            <textarea
              className={`${inputClass} min-h-32`}
              value={challenge}
              onChange={(event) => setChallenge(event.target.value)}
              placeholder="Describe brevemente el reto o la situación actual de tu empresa. Luego pulsá «Generar resumen»."
            />
          </Field>
          <button
            type="button"
            disabled={summary.isPending || challenge.trim() === ''}
            onClick={() => summary.mutate()}
            className="rounded-2xl border border-[var(--border)] px-4 py-2.5 text-sm hover:border-[var(--accent)] disabled:opacity-60"
          >
            {summary.isPending ? 'Generando resumen…' : 'Generar resumen'}
          </button>
          {profile.summary && (
            <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4">
              <p className="text-sm font-semibold">Resumen para mejorar tu empresa</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{profile.summary}</p>
              <p className="mt-3 text-sm font-medium">¿Te gustaría profundizar en alguno de estos puntos?</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeepen('si')}
                  className={`rounded-2xl px-3 py-1.5 text-sm ${deepen === 'si' ? 'bg-[var(--cta)] text-[var(--cta-text)]' : 'border border-[var(--border)]'}`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setDeepen('no')}
                  className={`rounded-2xl px-3 py-1.5 text-sm ${deepen === 'no' ? 'bg-[var(--cta)] text-[var(--cta-text)]' : 'border border-[var(--border)]'}`}
                >
                  No
                </button>
              </div>
            </div>
          )}
          <Nav step={5} onPrev={() => void persistAndGo(4)} onNext={() => void persistAndGo(6)} />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold">Revisar y enviar</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Revisá los datos de mercado y guardá la configuración del equipo.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Datos de mercado</h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Indicadores de mercado, análisis de tu web y enlaces, posicionamiento frente a
              competidores y recomendaciones según tu sector y ubicación.
            </p>
          </div>
          {!canLoadInsights && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <WizardAlertIcon className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1">
                Completá sector, descripción y propuesta de valor para cargar los datos de mercado.
              </span>
              <button type="button" className="underline" onClick={() => setStep(1)}>
                Ir a datos del negocio
              </button>
            </div>
          )}
          {canLoadInsights && !hasReport && !profile.insights_loading && !insights.isPending && (
            <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
              <WizardInfoIcon className="h-5 w-5 shrink-0" />
              Al guardar, el informe de mercado se genera después y aparece aquí cuando esté listo.
            </div>
          )}
          {(profile.insights_loading || insights.isPending) && (
            <AiLoader
              subtitle={
                profile.insights_phase === 'market_data'
                  ? 'Consultando datos de mercado y sector...'
                  : profile.insights_phase === 'web'
                    ? 'Analizando tu web...'
                    : profile.insights_phase === 'recommendations'
                      ? 'Generando recomendaciones con el asistente...'
                      : 'Procesando datos de mercado, web y recomendaciones · Se actualizará al terminar'
              }
            />
          )}
          {hasReport && profile.insights && (
            <div className="space-y-3">
              <div className="flex flex-row gap-3">
                {insightNumber(profile.insights.businesses_nearby) && (
                  <MetricCard
                    label="Negocios en tu zona"
                    value={insightNumber(profile.insights.businesses_nearby) ?? ''}
                    icon={<WizardBuildingStoreIcon className="h-4 w-4" />}
                  />
                )}
                {insightNumber(profile.insights.prospects) && (
                  <MetricCard
                    label="Prospectos"
                    value={insightNumber(profile.insights.prospects) ?? ''}
                    icon={<WizardUsersIcon className="h-4 w-4" />}
                  />
                )}
                {insightNumber(profile.insights.seniority_c_suite) && (
                  <MetricCard
                    label="C-Suite"
                    value={insightNumber(profile.insights.seniority_c_suite) ?? ''}
                    icon={<WizardCrownIcon className="h-4 w-4" />}
                  />
                )}
                {insightNumber(profile.insights.seniority_director) && (
                  <MetricCard
                    label="Directores"
                    value={insightNumber(profile.insights.seniority_director) ?? ''}
                    icon={<WizardBriefcaseIcon className="h-4 w-4" />}
                  />
                )}
                {insightNumber(profile.insights.seniority_manager) && (
                  <MetricCard
                    label="Managers"
                    value={insightNumber(profile.insights.seniority_manager) ?? ''}
                    icon={<WizardUserCheckIcon className="h-4 w-4" />}
                  />
                )}
                {industryTotal(profile.insights.by_industry) > 0 && (
                  <MetricCard
                    label="Por sector"
                    value={industryTotal(profile.insights.by_industry).toLocaleString('es-ES')}
                    icon={<WizardChartIcon className="h-4 w-4" />}
                  />
                )}
              </div>
              {typeof profile.insights.potential_clients_summary === 'string' && (
                <div className="overflow-hidden rounded-2xl border border-[var(--accent)]">
                  <div className="flex items-center gap-2 bg-[var(--accent-soft)] px-4 py-3">
                    <WizardReportIcon className="h-4 w-4" />
                    <p className="text-sm font-semibold">Informe de mercado</p>
                  </div>
                  <div
                    className="business-wizard__markdown p-4 text-sm"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(profile.insights.potential_clients_summary),
                    }}
                  />
                </div>
              )}
            </div>
          )}
          <Nav
            step={6}
            onPrev={() => void persistAndGo(5)}
            nextLabel="Guardar configuración"
            nextDisabled={save.isPending || insights.isPending}
            onNext={() => {
              void (async () => {
                await persistAndGo(6)
                if (!hasReport && canLoadInsights && !profile.insights_loading) {
                  insights.mutate()
                }
              })()
            }}
          />
        </div>
      )}

      {actionError && (
        <p className="text-sm text-[var(--danger)]">
          {actionError instanceof ApiError ? actionError.message : 'No se pudo guardar el negocio.'}
        </p>
      )}
      {save.isSuccess && step === 6 && (
        <p className="text-sm text-[var(--success)]">Negocio actualizado. Todas las apps lo usan.</p>
      )}
      </Panel>
    </>
  )
}

export function BusinessForm({ className = 'space-y-6 p-6' }: { className?: string }) {
  const profileQuery = useQuery({
    queryKey: ['business-profile'],
    queryFn: fetchBusinessProfile,
  })

  return (
    <div className="mt-6">
      {profileQuery.isLoading && (
        <Panel className={className}>
          <p className="text-sm text-[var(--muted)]">Cargando negocio…</p>
        </Panel>
      )}
      {profileQuery.isError && (
        <Panel className={className}>
          <p className="text-sm text-[var(--danger)]">
            {profileQuery.error instanceof ApiError
              ? profileQuery.error.message
              : 'No se pudo cargar el negocio.'}
          </p>
        </Panel>
      )}
      {profileQuery.data && <WizardFields initial={profileQuery.data} panelClassName={className} />}
    </div>
  )
}
