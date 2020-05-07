# comorbidityNetwork2d()

## Description
Display individual-level comorbidity data as a bipartite network with nodes as both cases and phecodes and edges corresponding to if a given case had a phecode or not. A force-layout algorithm is run in real time on the network allowing an intuitive view of how subsetting data changes structure.

The user can mouseover a phecode to see information about it along with selecting phecodes via clicking to isolate or delete them from the entire app. 


## Inputs
Takes a list of `edges` and `vertices` as generated from `meToolkit::setup_network_data()`. Additionally, node sizes and various force-layout parameters can be tweaked. 


## Outputs
Returns a reactive variable that deliver's payloads with two values: One, a list of codes that the user currently has selected, and two, a verb corresponding to what is to be done with those codes. The verb can take three forms:  

- `delete`: Remove these codes from app state.
- `isolate`: Isolate app state to just these codes.
- `invert`: Invert code in app state. 

