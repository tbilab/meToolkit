library(tidyverse)
context("test-simindividualdata")

# Load packaged fake phewas results dataframe with 1,578 phecodes
data("fake_phewas_results")

simulated_data_10 <- meToolkit::simIndividualData(fake_phewas_results, 10, 0.15)
simulated_data_100 <- meToolkit::simIndividualData(fake_phewas_results, 100, 0.15)
simulated_data_50_codes <- meToolkit::simIndividualData(fake_phewas_results %>% head(50), 10, 0.15)
simulated_data_high_snp <- meToolkit::simIndividualData(fake_phewas_results, 100, 0.95)
simulated_data_low_snp <- meToolkit::simIndividualData(fake_phewas_results, 100, 0.05)

test_that("Returned phenotype dataframe is the correct size", {
  expect_equal(
    simulated_data_10$phenotypes %>% dim(),
    c(10, 1578+1)
  )
  expect_equal(
    simulated_data_100$phenotypes %>% dim(),
    c(100, 1578+1)
  )
  expect_equal(
    simulated_data_50_codes$phenotypes %>% dim(),
    c(10, 50+1)
  )
})

test_that("Returned individual-snp data is right dimensions", {
  expect_equal(
    simulated_data_10$snp_status %>% dim(),
    c(10, 2)
  )
  expect_equal(
    simulated_data_100$snp_status %>% dim(),
    c(100, 2)
  )
})

test_that("Observed snp frequencies are reasonable", {
  expect_equal(
    mean(simulated_data_100$snp_status$snp), 0.15, tolerance = 0.1
  )
  expect_equal(
    mean(simulated_data_high_snp$snp_status$snp), 0.95, tolerance = 0.1
  )
  expect_equal(
    mean(simulated_data_low_snp$snp_status$snp), 0.05, tolerance = 0.1
  )
})
