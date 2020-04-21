using ApplicationIntegration.Components;
using Umbraco.Core;
using Umbraco.Core.Composing;

namespace ApplicationIntegration.Composers
{
    [RuntimeLevel(MinLevel = RuntimeLevel.Run)]
    public class LetsLogComposer : IUserComposer
    {
        public void Compose(Composition composition)
        {
            composition.Components().Append<LetsLogComponent>();
            //next component
            //next one
        }
    }
}