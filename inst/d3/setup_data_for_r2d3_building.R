library(here)
library(tidyverse)

# Load data for running upset in r2d3 preview, this has all data
data_for_upset <- here('module_tests/data/upset_r2d3_data.rds') %>% read_rds()
options <- data_for_upset$options
options$min_set_size <- 150
options$snp_filter <- FALSE


# Data with the snp filter enabled
data_for_upset <- here('module_tests/data/upset_snp_filtered_data.rds') %>% read_rds()
options <- data_for_upset$options
options$min_set_size <- 150
options$snp_filter <- TRUE


r2d3::r2d3(
  data = data_for_upset$data, options = options,
  script = here("inst/d3/upset/upset.js"),
  css = here("inst/d3/upset/upset.css"),
  dependencies = c("d3-jetpack",here('inst/d3/upset/helpers.js'))
)
