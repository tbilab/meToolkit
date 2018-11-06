library(tibble)

current_codes <- tibble(
  code =     c('001.00', '002.00', '003.00', '004.00', '005.00'),
  inverted = c(FALSE,    FALSE,    TRUE,     FALSE,    FALSE)
)

context("test-code_filtering")


test_that("deletion works", {
  after_deletion <- tibble(
    code =     c('001.00',  '004.00', '005.00'),
    inverted = c(FALSE,     FALSE,    FALSE)
  )
  expect_equal(
    deleteCodes(codes_to_delete = c('002.00', '003.00'), current_codes),
    after_deletion
  )
})


test_that("isolation works", {
  after_isolation <- tibble(
    code =     c('001.00',  '004.00'),
    inverted = c(FALSE,     FALSE )
  )
  expect_equal(
    isolateCodes(codes_to_isolate = c('001.00', '004.00'), current_codes),
    after_isolation
  )
})

context("test-code_inversion")


test_that("Inversion works", {
  expect_equal(
    invertCodes(c('001.00', '002.00'), c('001.00', '005.00')),
    c('002.00', '005.00')
  )
})
