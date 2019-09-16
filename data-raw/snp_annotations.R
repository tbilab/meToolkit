## code to prepare `snp_annotations` dataset goes here
library(tidyverse)

clean_text_field <- . %>%
  str_replace_all('&', ', ') %>%
  str_replace_all('_', ' ') %>%
  tolower()

snp_annotations <- read_csv(
  here::here('data/full_exome_annotations.csv'),
  col_names = TRUE,
  cols(
    snp = col_character(),
    chr = col_character(),
    gene = col_character(),
    rsid = col_character(),
    Consequence = col_character(),
    IMPACT = col_character(),
    SYMBOL = col_character(),
    Gene = col_character(),
    HGVSp = col_character(),
    Existing_variation = col_character(),
    ExAC_MAF = col_character(),
    CLIN_SIG = col_character()
  )) %>%
  rename(
    name = snp,
    rsid = rsid,
    consequence = Consequence,
    impact = IMPACT,
    symbol = SYMBOL,
    gene_id = Gene,
    existing_variant = Existing_variation,
    clinical_sig = CLIN_SIG
  ) %>%
  separate(
    ExAC_MAF,
    into = c('minor_allele', 'maf'),
    sep = ":"
  ) %>%
  mutate(
    maf = str_remove_all(maf, '&[A,T,C,G,U]+'),
    clinical_sig = clean_text_field(clinical_sig),
    consequence = clean_text_field(consequence),
    impact = clean_text_field(impact)
  ) %>%
  select(
    rsid,
    name,
    chr,
    gene,
    minor_allele,
    maf,
    clinical_sig,
    consequence,
    impact,
    symbol,
    gene_id,
    HGVSp,
    existing_variant
  )


usethis::use_data(snp_annotations)
