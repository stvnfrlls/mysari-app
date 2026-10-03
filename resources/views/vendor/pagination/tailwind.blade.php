@if ($paginator->hasPages())
    <nav class="pager" role="navigation" aria-label="Pagination">
        <p class="pager-info">
            Showing {{ $paginator->firstItem() }} to {{ $paginator->lastItem() }} of {{ $paginator->total() }} results
        </p>
        <div class="pager-links">
            @if ($paginator->onFirstPage())
                <span class="pager-item disabled">Previous</span>
            @else
                <a class="pager-item" href="{{ $paginator->previousPageUrl() }}" rel="prev">Previous</a>
            @endif

            @foreach ($elements as $element)
                @if (is_string($element))
                    <span class="pager-item disabled">{{ $element }}</span>
                @endif

                @if (is_array($element))
                    @foreach ($element as $page => $url)
                        @if ($page == $paginator->currentPage())
                            <span class="pager-item current" aria-current="page">{{ $page }}</span>
                        @else
                            <a class="pager-item" href="{{ $url }}">{{ $page }}</a>
                        @endif
                    @endforeach
                @endif
            @endforeach

            @if ($paginator->hasMorePages())
                <a class="pager-item" href="{{ $paginator->nextPageUrl() }}" rel="next">Next</a>
            @else
                <span class="pager-item disabled">Next</span>
            @endif
        </div>
    </nav>
@endif
