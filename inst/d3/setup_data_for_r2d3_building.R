library(here)
library(tidyverse)

snp_filtered = FALSE

if(snp_filtered){
  # Data with the snp filter enabled
  data_for_upset <- here('module_tests/data/upset_snp_filtered_data.rds') %>% read_rds()
  options <- data_for_upset$options
} else {
  # Load data for running upset in r2d3 preview, this has all data
  data_for_upset <- here('module_tests/data/upset_r2d3_data.rds') %>% read_rds()
  options <- data_for_upset$options
}

options$colors <- list(light_grey = "#f7f7f7",med_grey = "#d9d9d9",dark_grey = "#bdbdbd",light_blue = "#4292c6")
options$min_set_size <- 150



r2d3::r2d3(
  data = data_for_upset$data, options = options,
  script = here("inst/d3/upset/upset.js"),
  css = here("inst/d3/upset/upset.css"),
  dependencies = c("d3-jetpack",here('inst/d3/upset/helpers.js'))
)


