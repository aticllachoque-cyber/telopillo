import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Política de privacidad de Telopillo: qué datos personales recogemos, cómo los usamos, con quién los compartimos y cuáles son tus derechos.',
  openGraph: {
    title: 'Política de privacidad | Telopillo',
    description: 'Cómo protegemos y usamos tus datos en Telopillo.',
    siteName: 'Telopillo',
    type: 'website',
  },
}

const CONTACT_EMAIL = 'aticllachoque@gmail.com'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <div className="space-y-3 text-pretty text-muted-foreground">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background py-12 sm:py-16">
      <div className="container mx-auto max-w-3xl px-4">
        <Card className="border-border/60 shadow-md">
          <CardContent className="space-y-10 p-8 sm:p-10">
            <header className="space-y-4 border-b border-border/60 pb-6">
              <ShieldCheck className="size-10 text-primary" aria-hidden />
              <div className="space-y-2">
                <h1 className="text-balance text-2xl font-bold sm:text-3xl">
                  Política de privacidad
                </h1>
                <p className="text-sm text-muted-foreground">
                  Última actualización: 17 de septiembre de 2026
                </p>
              </div>
              <p className="text-pretty text-muted-foreground">
                Telopillo (&quot;el marketplace boliviano&quot;) respeta tu privacidad. Esta
                política explica qué datos personales recogemos cuando usás la plataforma, cómo los
                usamos, con quién los compartimos y qué derechos tenés sobre ellos. Al crear una
                cuenta en Telopillo aceptás el tratamiento de tus datos según lo descrito aquí.
              </p>
            </header>

            <Section title="1. Responsable del tratamiento">
              <p>
                El responsable del tratamiento de tus datos personales es Telopillo, plataforma
                operada desde Bolivia. Podés contactarnos por cualquier asunto de privacidad en{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </Section>

            <Section title="2. Qué datos recogemos">
              <p>Según cómo usés la plataforma, recogemos:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-foreground">Datos de cuenta:</strong> tu correo
                  electrónico y, si te registrás con Google, tu nombre y foto de perfil de Google.
                </li>
                <li>
                  <strong className="text-foreground">Datos de perfil:</strong> nombre completo,
                  teléfono, ciudad y departamento.
                </li>
                <li>
                  <strong className="text-foreground">Datos de negocio (opcional):</strong> nombre
                  del negocio, categoría, descripción, NIT, dirección, horarios de atención, sitio
                  web y redes sociales (Facebook, Instagram, TikTok, WhatsApp).
                </li>
                <li>
                  <strong className="text-foreground">Contenido que publicás:</strong> productos
                  (título, descripción, precio, fotos, ubicación), publicaciones de búsqueda
                  (&quot;Busco/Necesito&quot;) y ofertas que hacés a otras personas.
                </li>
                <li>
                  <strong className="text-foreground">Datos de uso:</strong> las consultas que
                  buscás en la plataforma, para mejorar los resultados de búsqueda.
                </li>
              </ul>
            </Section>

            <Section title="3. Cómo usamos tus datos">
              <ul className="list-disc space-y-2 pl-6">
                <li>Crear y administrar tu cuenta y mantener tu sesión iniciada.</li>
                <li>
                  Mostrar tu perfil, tus productos y tu negocio a otras personas del marketplace.
                </li>
                <li>
                  Permitir que compradores y vendedores se contacten (por ejemplo, vía WhatsApp con
                  el número que publicaste).
                </li>
                <li>
                  Procesar tus búsquedas, incluida la búsqueda semántica que entiende sinónimos y
                  lenguaje natural.
                </li>
                <li>Verificar tu identidad o la de tu negocio cuando lo solicites.</li>
                <li>Prevenir abusos, fraudes y publicaciones prohibidas.</li>
              </ul>
              <p>
                No vendemos tus datos personales ni los usamos para publicidad dirigida de terceros.
              </p>
            </Section>

            <Section title="4. Con quién compartimos tus datos">
              <p>
                Telopillo usa proveedores de servicios que procesan datos en nuestro nombre y solo
                para operar la plataforma:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-foreground">Supabase</strong> (base de datos,
                  autenticación y almacenamiento de imágenes; servidores en el exterior).
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> (alojamiento del sitio web).
                </li>
                <li>
                  <strong className="text-foreground">Google</strong> (inicio de sesión con tu
                  cuenta de Google, cuando elegís esa opción).
                </li>
                <li>
                  <strong className="text-foreground">Hugging Face</strong> (procesamiento del texto
                  de tus búsquedas para la búsqueda semántica).
                </li>
              </ul>
              <p>
                Podemos divulgar datos si una autoridad competente lo exige por ley, o en la medida
                necesaria para proteger derechos, seguridad o prevenir fraudes.
              </p>
            </Section>

            <Section title="5. Retención de datos">
              <p>
                Conservamos tus datos mientras tu cuenta esté activa. Si eliminás tu cuenta,
                borramos tu perfil, tus datos de negocio y tu información de acceso. Algunos
                contenido públicos (como productos) pueden despublicarse de forma progresiva. Podés
                solicitar la eliminación total en cualquier momento escribiéndonos al correo de
                contacto.
              </p>
            </Section>

            <Section title="6. Tus derechos">
              <p>Vas a poder, en cualquier momento y sin costo:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong className="text-foreground">Acceder</strong> a los datos personales que
                  tenemos sobre vos.
                </li>
                <li>
                  <strong className="text-foreground">Rectificar</strong> o actualizar tus datos
                  desde tu perfil o solicitándolo por correo.
                </li>
                <li>
                  <strong className="text-foreground">Eliminar</strong> tu cuenta y tus datos
                  personales.
                </li>
                <li>
                  <strong className="text-foreground">Oponerte</strong> a tratamientos específicos o
                  retirar tu consentimiento (por ejemplo, desconectar tu cuenta de Google desde los
                  permisos de tu cuenta Google).
                </li>
              </ul>
              <p>
                Para ejercer estos derechos escribinos a{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                . Respondemos en un plazo razonable.
              </p>
            </Section>

            <Section title="7. Seguridad">
              <p>
                Protegemos tus datos con medidas técnicas apropiadas: tráfico cifrado (HTTPS),
                acceso restringido por cuenta a nivel de base de datos, claves de acceso protegidas
                y revisión continua de nuestra configuración. Ningún sistema es 100% seguro, pero
                trabajamos para reducir riesgos. Si detectás un problema de seguridad, avisanos al
                correo de contacto.
              </p>
            </Section>

            <Section title="8. Menores de edad">
              <p>
                Telopillo no está dirigida a menores de 18 años. No recogemos conscientemente datos
                de menores. Si creés que un menor creó una cuenta, contactanos para eliminarla.
              </p>
            </Section>

            <Section title="9. Cambios a esta política">
              <p>
                Podemos actualizar esta política para reflejar cambios en la plataforma o en la
                normativa. Publicaremos la versión vigente en esta página con la fecha de
                actualización. Si el cambio es significativo, te avisaremos dentro de la plataforma
                o por correo.
              </p>
            </Section>

            <Section title="10. Legislación aplicable">
              <p>
                Esta política se rige por la legislación boliviana aplicable, incluida la Ley N.º
                164 de Telecomunicaciones y Tecnologías de Información y Comunicación, y las
                garantías de privacidad de la Constitución Política del Estado.
              </p>
            </Section>

            <footer className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <p>
                ¿Preguntas sobre esta política? Escribinos a{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  {CONTACT_EMAIL}
                </a>
                . Revisá también nuestros{' '}
                <a
                  href="/terminos"
                  className="font-medium text-primary underline underline-offset-4"
                >
                  términos y condiciones
                </a>
                .
              </p>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
