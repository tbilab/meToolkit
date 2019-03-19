# Setup data to run network javascript file

library(tidyverse)

network_data <- read_rds(here::here('data/fake_network_data.rds')) %>%
  jsonlite::toJSON()
