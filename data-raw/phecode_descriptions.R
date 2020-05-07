# Phecode 1.2 descriptions were downloaded from https://phewascatalog.org/files/phecode_definitions1.2.csv.zip
# on 02-14-2020.

library(dplyr)

phecode_descriptions <-
  readr::read_csv('data-raw/phecode_definitions1.2.csv') %>%
  transmute(
    phecode = normalize_phecodes(phecode),
    description = phenotype,
    category = ifelse(category == "NULL", 'other', category)
  ) %>%
  arrange(as.numeric(phecode))


usethis::use_data(phecode_descriptions, overwrite = TRUE)
