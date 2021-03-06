% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/mod_network_plot.R
\name{network_plot}
\alias{network_plot}
\title{Subject-level network diagram: Server}
\usage{
network_plot(
  input,
  output,
  session,
  network_data,
  highlighted_codes,
  snp_filter,
  viz_type = "free",
  update_freq = 15,
  action_object
)
}
\arguments{
\item{input, output, session}{Auto-filled by callModule | ignore}

\item{network_data}{Reactive object containing individual network data as
generated by \code{meToolkit::setup_network_data}.}

\item{highlighted_codes}{Reactive object containing list with \code{type}:
(\verb{\{'pattern', 'code'\}}) and \code{codes}: array of code names that comprise
connection pattern to highlight in patients.}

\item{snp_filter}{Reactive object containing boolean containing info on if
we've filtered by snp or not.}

\item{viz_type}{Character string containing info on which type of network we
want to draw. "bipartite" for a plot that puts one node type on either
size, or free for a traditional force directed layout. Defaults to
\code{'free'}.}

\item{update_freq}{How many iterations of the layout simulation are run
between redrawing the viz. Set to lower value for a smoother animation,
higher for better performance. Default is \code{15} frames.}

\item{action_object}{A \code{reactiveVal} that will be updated by the module
upon isolation, deletion, or snp_filtering.}
}
\value{
Server component of interactive network plot. Returns type-payload
list with the type \code{"isolation, deletion, snp_filtering"} to the
passed \code{action_object} for updating app state.
}
\description{
Subject-level network diagram: Server
}
\examples{
callModule(info_panel, 'info_panel', snp_name, individual_data, subset_maf)
}
\seealso{
\code{\link{network_plot_UI}}
}
