using System.Linq;
using Umbraco.Core.Composing;
using Umbraco.Core.Events;
using Umbraco.Core.Logging;
using Umbraco.Core.Services;
using Umbraco.Core.Services.Implement;

namespace ApplicationIntegration.Components
{
    public class PingComponent : IComponent
    {
        private readonly ILogger _logger;

        public PingComponent(ILogger logger) => _logger = logger;

        public void Initialize()
        {
            _logger.Debug<PingComponent>("Initializing PingComponent");
            ContentService.Published += ContentService_Published;
        }

        private void ContentService_Published(IContentService sender, ContentPublishedEventArgs e) =>
            _logger.Info<PingComponent>("You just published {Entities} entities", e.PublishedEntities.Count());

        public void Terminate() { }
    }
}