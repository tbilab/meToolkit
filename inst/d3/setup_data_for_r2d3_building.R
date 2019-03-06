library(here)
# Load data for running upset in r2d3 preview
data_for_upset <- here('module_tests/data/upset_r2d3_data.rds') %>% read_rds()
r2d3::r2d3(
  data = data_for_upset$data, options = data_for_upset$options,
  script = here("inst/d3/upset/upset.js"),
  css = here("inst/d3/upset/upset.css"),
  dependencies = "d3-jetpack"
)
