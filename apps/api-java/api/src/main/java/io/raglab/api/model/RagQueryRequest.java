package io.raglab.api.model;



import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.List;


public class RagQueryRequest {

  private String query;

  @Min(1)
  @Max(50)
  private int topK = 5;

  private Filters filters;
  private Options options;

  public String getQuery() { return query; }
  public void setQuery(String query) { this.query = query; }

  public int getTopK() { return topK; }
  public void setTopK(int topK) { this.topK = topK; }

  public Filters getFilters() { return filters; }
  public void setFilters(Filters filters) { this.filters = filters; }

  public Options getOptions() { return options; }
  public void setOptions(Options options) { this.options = options; }

  public static class Filters {
    private List<String> docIds;
    private List<String> tags;

    public List<String> getDocIds() { return docIds; }
    public void setDocIds(List<String> docIds) { this.docIds = docIds; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
  }

  public static class Options {
    private boolean returnCitations = true;
    private boolean returnDebug = false;

    public boolean isReturnCitations() { return returnCitations; }
    public void setReturnCitations(boolean returnCitations) { this.returnCitations = returnCitations; }

    public boolean isReturnDebug() { return returnDebug; }
    public void setReturnDebug(boolean returnDebug) { this.returnDebug = returnDebug; }
  }
}
