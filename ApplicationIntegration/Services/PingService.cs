using ApplicationIntegration.Services.Interfaces;
using Umbraco.Core.Logging;

namespace ApplicationIntegration.Services
{
    public class PingService : IPingService
    {
        private readonly ILogger _logger;

        public PingService(ILogger logger) => _logger = logger;        

        public void SayHiTotheLog() => _logger.Info<PingService>("I COME FROM DOWN");

    }
}