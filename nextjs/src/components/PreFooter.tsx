import { GitHubLogo } from './logos/GitHubLogo'
import { LocalIntelligenceHubLogo } from './logos/LocalIntelligenceHubLogo'
import { MySocietyLogo } from './logos/MySocietyLogo'
import TemplateCard from './marketing/TemplateCard'
export default function PreFooter() {
  return (
    <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
      <TemplateCard
        highlighted={true}
        heading="Made by Common Knowledge"
        description="Common Knowledge is a not-for-profit worker cooperative dedicated to building technology to help social movements build power."
        link="https://commonknowledge.coop/"
        isExternalLink={true}
      />
      <TemplateCard
        heading="Thanks to My Society's Local Intelligence Hub"
        description="Mapped is built on top of My Society's open source Local Intelligence Hub."
        highlighted={true}
        logo={[
          { content: <MySocietyLogo />, url: 'https://www.mysociety.org' },
          {
            content: <LocalIntelligenceHubLogo />,
            url: 'https://github.com/mysociety/local-intelligence-hub',
          },
        ]}
      />

      <TemplateCard
        highlighted={true}
        heading="Support us"
        description="We do this work pro bono and rely on funding for our mission to build tools for organising. You can help us ramp up our activity by supporting us with regular donations."
        link="https://commonknowledge.coop/"
        isExternalLink={true}
      />
      <TemplateCard
        highlighted={true}
        heading="Contact us"
        description="We’d love to hear from you if you have feedback and requests for similar tools, or if you’d like to collaborate with us on a project."
        link="mailto:hello@commonknowledge.coop"
        isExternalLink={true}
      />
      <TemplateCard
        heading="Check out the code"
        description="Open sourced on Github under the GNU Affero GPL license"
        highlighted={true}
        isExternalLink={true}
        link="https://github.com/commonknowledge/mapped"
        logo={[{ content: <GitHubLogo /> }]}
      />
    </div>
  )
}
