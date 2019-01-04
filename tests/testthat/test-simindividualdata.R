library(tidyverse)
context("test-simindividualdata")

test_that("Correct number of columns and rows are returned", {
  expect_equal(
    meToolkit::simIndividualData(n_codes = 5, n_cases = 10, prob_snp = 0.1) %>% dim(),
    c(10, 7)
  )

  expect_equal(
    meToolkit::simIndividualData(n_codes = 20, n_cases = 100, prob_snp = 0.1) %>% dim(),
    c(100, 22)
  )
})


test_that('Every case has at least a single code', {

  case_code_counts <- meToolkit::simIndividualData(n_codes = 20, n_cases = 100, prob_snp = 0.1) %>%
    select(-snp) %>%
    tidyr::gather(code, value, -IID) %>%
    group_by(IID) %>%
    summarise(num_codes = sum(value))

  expect_equal(
    sum(case_code_counts$num_codes == 0),
    0
  )
})
