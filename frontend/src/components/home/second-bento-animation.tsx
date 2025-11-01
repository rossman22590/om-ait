import { Icons } from '@/components/home/icons';
import { OrbitingCircles } from '@/components/home/ui/orbiting-circle';
import { KortixLogo } from '@/components/sidebar/kortix-logo';

export function SecondBentoAnimation() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute bottom-0 left-0 h-20 w-full bg-gradient-to-t from-background to-transparent z-20"></div>
      <div className="pointer-events-none absolute top-0 left-0 h-20 w-full bg-gradient-to-b from-background to-transparent z-20"></div>

      <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 size-16 bg-black p-2 rounded-full z-30 md:bottom-0 md:top-auto">
        <div className="size-10 flex items-center justify-center">
          <KortixLogo size={40} />
        </div>
      </div>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
        <div className="relative flex h-full w-full items-center justify-center translate-y-0 md:translate-y-32">
          <OrbitingCircles
            index={0}
            iconSize={60}
            radius={100}
            reverse
            speed={1}
          >
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/slack/4A154B" alt="Slack" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/googledocs/4285F4" alt="Google Docs" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://img.icons8.com/color/96/microsoft-excel-2019--v1.png" alt="Excel" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/gmail/EA4335" alt="Gmail" className="size-8" />
            </div>
          </OrbitingCircles>

          <OrbitingCircles index={1} iconSize={60} speed={0.5}>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/googlecalendar/4285F4" alt="Google Calendar" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/notion/000000" alt="Notion" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="WhatsApp" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/trello/0052CC" alt="Trello" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/googlesheets/34A853" alt="Google Sheets" className="size-8" />
            </div>
          </OrbitingCircles>

          <OrbitingCircles
            index={2}
            iconSize={60}
            radius={230}
            reverse
            speed={0.5}
          >
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://img.icons8.com/color/96/microsoft-outlook-2019--v2.png" alt="Outlook" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/salesforce/00A1E0" alt="Salesforce" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/asana/F06A6A" alt="Asana" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://img.icons8.com/color/96/microsoft-teams.png" alt="Teams" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://cdn.simpleicons.org/apple/000000" alt="Apple Mail" className="size-8" />
            </div>
            <div className="size-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" className="size-8" />
            </div>
          </OrbitingCircles>

          {/* Additional outer ring for more tools */}
          <OrbitingCircles
            index={3}
            iconSize={50}
            radius={320}
            speed={0.3}
          >
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/googlechrome/4285F4" alt="Chrome" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/x/000000" alt="X (Twitter)" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/instagram/E4405F" alt="Instagram" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/facebook/0866FF" alt="Facebook" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/zoom/0B5CFF" alt="Zoom" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/dropbox/0061FF" alt="Dropbox" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/github/181717" alt="GitHub" className="size-6" />
            </div>
            <div className="size-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 opacity-75">
              <img src="https://cdn.simpleicons.org/openai/412991" alt="OpenAI" className="size-6" />
            </div>
          </OrbitingCircles>
        </div>
      </div>
    </div>
  );
}
