using Umbraco.Web.Mvc;
using ApplicationIntegration.Services.Interfaces;
using System.Web.Mvc;
using Umbraco.Web.Models;
using ClientDependency.Core.Logging;

namespace ApplicationIntegration.Controllers
{
    public class PingController : RenderMvcController
    {
        private readonly IPingService _pingService;
        
        public PingController(IPingService pingService)
        {
            _pingService = pingService;
        }

        public ActionResult Index(ContentModel model)
        {
            _pingService.SayHiTotheLog();
            return base.Index(model);
        }
    }
}