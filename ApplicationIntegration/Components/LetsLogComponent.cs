using System.Linq;
using Umbraco.Core.Composing;
using Umbraco.Core.Events;
using Umbraco.Core.Logging;
using Umbraco.Core.Services;
using Umbraco.Core.Services.Implement;

namespace ApplicationIntegration.Components
{
    public class LetsLogComponent : IComponent
    {
        private readonly ILogger _logger;

        public LetsLogComponent(ILogger logger) => _logger = logger;

        public void Initialize()
        {
            _logger.Debug<LetsLogComponent>("Initializing LetsLogComponent");
            ContentService.Published += ContentService_Published;
        }

        private void ContentService_Published(IContentService sender, ContentPublishedEventArgs e) =>
            _logger.Info<LetsLogComponent>("You just published {Entities} entities", e.PublishedEntities.Count());

        public void Terminate() { }
    }
}