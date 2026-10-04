<?php

namespace App\Http\Controllers;

use App\Models\DailySummary;

class DailySummaryController extends Controller
{
    public function index()
    {
        $summaries = DailySummary::orderByDesc('summary_date')->paginate(31);

        return view('summaries.index', compact('summaries'));
    }
}
