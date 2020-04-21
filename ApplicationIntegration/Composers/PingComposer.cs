using ApplicationIntegration.Components;
using ApplicationIntegration.Controllers;
using ApplicationIntegration.Services;
using ApplicationIntegration.Services.Interfaces;
using Umbraco.Core;
using Umbraco.Core.Composing;
using Umbraco.Web;

namespace ApplicationIntegration.Composers
{
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    public class PingComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.SetDefaultRenderMvcController<PingController>();
            composition.Components().Append<PingComponent>();            
            composition.Register<IPingService, PingService>(Lifetime.Singleton);
            //next component
            //next one
        }
    }
}