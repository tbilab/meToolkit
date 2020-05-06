context("test-subset_to_codes")

library(tibble)
library(meToolkit)


sample_phenotypes <- as_tibble(matrix(c(
  0, 1, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 0,
  0, 0, 1, 1, 0,
  0, 1, 1, 0, 1,
  1, 1, 0, 0, 1,
  0, 0, 0, 0, 1,
  0, 1, 0, 0, 0,
  0, 0, 0, 0, 1,
  0, 1, 1, 1, 0 ), ncol = 5, byrow = TRUE ),.name_repair = 'minimal')

colnames(sample_phenotypes) <- c('001.00', '002.00', '003.00', '004.00', '005.00')
sample_phenotypes['IID'] <- letters[1:10]
sample_phenotypes['snp'] <- rbinom(n = 10, prob = 0.5, size = 2)




test_that("subsetting", {

  simple_subset <- subset_to_codes(sample_phenotypes, c('001.00', '002.00'))

  expect_equal(ncol(simple_subset), 4)

  expect_equal(nrow(simple_subset), 6)

  expect_setequal(c('a', 'b', 'e', 'f', 'h', 'j'), simple_subset$IID)
})

test_that("Inverting", {

  simple_invert <- subset_to_codes(
    sample_phenotypes,
    c('001.00', '002.00', '005.00'),
    codes_to_invert = c('002.00')
  )

  expect_equal(ncol(simple_invert), 5)

  expect_equal(nrow(simple_invert), 6)

  expect_setequal(c('c', 'd', 'e', 'f', 'g', 'i'), simple_invert$IID)
})

test_that("Handles non-normalized codes", {

  unnormed_codes <- subset_to_codes(
    sample_phenotypes,
    c('1.0', '02.00', '005')
  )

  expect_equal(ncol(unnormed_codes), 5)
})
