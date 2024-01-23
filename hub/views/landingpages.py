from django.conf import settings
from django.shortcuts import redirect
from django.urls import path
from django.views.generic import TemplateView

from hub.mixins import TitleMixin


class BaseLandingPageView(TitleMixin, TemplateView):
    template_name = "hub/landing_page.html"

    # Default values which could be overridden in the extending Views
    example_filter_label = "Great Big Green Week events 2023"
    example_filter_comparator = "is greater than"
    example_filter_value = "1"
    example_shader_label = "MP majority"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = self.page_title
        context["meta_description"] = self.meta_description
        context["example_filter_label"] = self.example_filter_label
        context["example_filter_comparator"] = self.example_filter_comparator
        context["example_filter_value"] = self.example_filter_value
        context["example_shader_label"] = self.example_shader_label
        context["intro_text"] = self.intro_text
        context["search_form_label"] = self.search_form_label

        if len(self.page_title) < 40:
            context["title_size"] = 3
        elif len(self.page_title) < 80:
            context["title_size"] = 4
        else:
            context["title_size"] = 5

        return context


class LandingPageIndexView(TitleMixin, TemplateView):
    template_name = "hub/landing_page_index.html"
    page_title = "Landing pages"

    def get(self, request):
        if not settings.DEBUG:
            return redirect("/")
        return super().get(request)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["urlpatterns"] = urlpatterns
        return context


class LandingPage01View(BaseLandingPageView):
    page_title = "Climate data for your area"
    intro_text = "How much support is there for climate action in your local community? How did your MP vote on environmental issues? What other factors affect climate action in your constituency?"
    search_form_label = (
        "Input your postcode to see all the climate-related data for your area."
    )
    meta_description = f"{intro_text} Input your postcode to find out."


class LandingPage02View(BaseLandingPageView):
    page_title = "Public opinion on climate"
    intro_text = "If you’re campaigning for climate or environmental issues, it’s useful to know how much support there is for decarbonisation initiatives in your local area. Who backs climate action, and what percentage of the population backs net zero?"
    search_form_label = "Input your postcode to see how much support there is for climate action in your local area."
    meta_description = f"{intro_text} Input your postcode to find out."
    example_filter_label = "Believe that the government should continue the block on onshore wind development"
    example_filter_value = "25%"
    example_shader_label = "Support renewable energy projects in their local area"


class LandingPage03View(BaseLandingPageView):
    page_title = "Demographics for your area"
    intro_text = "Discover demographic data at a constituency level and see how it intersects with other data for your local area."
    search_form_label = "Input your postcode to see socio-economic stats, ethnicity, age distribution, fuel poverty data and more for your local area."
    meta_description = f"{intro_text} Socio-economic stats, age distribution, fuel povery and more, on the Local Intelligence Hub."
    example_filter_label = "Index of Multiple Deprivation (IMD)"
    example_filter_comparator = "is less than"
    example_filter_value = "4"
    example_shader_label = "Estimated child poverty"


class LandingPage04View(BaseLandingPageView):
    page_title = "Real time data on flood risk and air quality for your local area"
    intro_text = "What are the environmental factors affecting your constituency area? Access clear data on flood risk, air and water quality, along with other climate and environmental data for your local neighbourhood."
    search_form_label = (
        "Input your postcode to see up-to-date information for your constituency."
    )
    meta_description = f"{intro_text} Input your postcode to find out."
    example_filter_label = "Support onshore wind"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "75%"
    example_shader_label = "Flood risk from rivers or sea"


class LandingPage05View(BaseLandingPageView):
    page_title = "Local groups and organisations in your area"
    intro_text = "Working together with the climate-interested organisations in your local area can bring extra resource and energy to your climate campaigning. Check our local pages to see whether the following organisations operate a branch in your area: Women’s Institute (WI), Friends of the Earth (FoE), National Trust, Woodland Trust, World Wildlife Fund (WWF) and more."
    search_form_label = "Input your postcode to discover which organisations are active in your constituency."
    meta_description = intro_text
    example_filter_label = "Number of Trussell Trust foodbanks"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "3"
    example_shader_label = "Number of Save the Children shops"


class LandingPage06View(BaseLandingPageView):
    page_title = "All about your MP"
    intro_text = "If you’re campaigning around climate, the environment, or any related issues, it pays to have a good understanding of your MP, what motivates them, and how they feel about issues like Net Zero. You can find out all that and more on the Local Intelligence Hub, a collection of locally-focused per-constituency data that includes a deep dive into your member of Parliament and their interests."
    search_form_label = "Input your postcode to discover how your MP has voted, what committees and groups they’re a member of, and what size majority they had in the last election."
    meta_description = f"{intro_text} All you need is your postcode."
    example_filter_label = "MP signed Possible’s 2019 Onshore Wind Energy open letter"
    example_filter_comparator = "is"
    example_filter_value = "True"
    example_shader_label = "Support renewable energy projects in their local area"


class LandingPage07View(BaseLandingPageView):
    page_title = "Election data for your area"
    intro_text = "We have up-to-date constituency-level data, showing how people voted in your constituency in the last election and what their intentions are for the next one. Discover how much of a safe seat your MP has and whether climate is the issue likely to mean a change in voting patterns."
    search_form_label = "Input your postcode to find the latest data on voting intention for your constituency, plus the breakdown of vote share, the size of your MP’s majority and more."
    meta_description = f"{intro_text} All you need is your postcode."
    example_filter_label = "Considering voting for a different party in the next General Election to the one they voted for in 2019"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "39%"
    example_shader_label = "Believe that the government should use wind and solar farms to reduce energy bills"


class LandingPage08View(BaseLandingPageView):
    page_title = "Sustainable energy data for your area"
    intro_text = "Before you campaign at a local level for better sustainable energy options, make sure you’re up to date on what exactly is already happening within your constituency, from onshore and offshore wind projects to community sustainable energy or power co-operatives and clean energy initiatives."
    search_form_label = "Input your postcode to find the latest data on renewable energy initiatives, wind power, solar and other climate-friendly power projects in your local area."
    meta_description = f"{intro_text} Input your postcode to find the latest data."
    example_filter_label = "Support onshore wind"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "75%"
    example_shader_label = "Tackling climate change should be one of the Government’s biggest priorities right now"


class LandingPage09View(BaseLandingPageView):
    page_title = "Data on nature for your area"
    intro_text = "How much support is there for wildlife conservation in your local community? How did your MP vote on environmental issues? What other factors affect nature and biodiversity in your constituency?"
    search_form_label = (
        "Input your postcode to see all the nature-related data for your area."
    )
    meta_description = f"{intro_text} Input your postcode to find out."
    example_filter_label = "Number of Wildlife Trusts Reserves"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "1"
    example_shader_label = "Number of RSPB Reserves"


class LandingPage10View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK. Find stats to inform your climate action, learn more about nationwide climate data and discover where to campaign most effectively."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Believe the government has increased investment in renewables over the past 5 years"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "52%"
    example_shader_label = "Have not been able to afford to turn the heating on at home when they have felt cold in the past month"


class LandingPage11View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK, including demographics such as deprivation, urbanness and rurality, fuel poverty and population density."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Index of Multiple Deprivation (IMD)"
    example_filter_comparator = "is less than"
    example_filter_value = "2"
    example_shader_label = "Urban Rural Classification"


class LandingPage12View(BaseLandingPageView):
    page_title = "Need insights on the various UK political parties and their stances around the climate emergency?"
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK, including party climate policies, voting records and pledges."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "MP membership of Conservative Environment Network (CEN)"
    example_filter_comparator = "is"
    example_filter_value = "True"
    example_shader_label = "MP vote on Ban on Fracking for Shale Gas Bill"


class LandingPage13View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK — including info on swing voters, the red and blue walls, which MPs have small majorities, and where MPs are likely to lose their seats."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Considering voting for a different party in the next General Election to the one they voted for in 2019"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "39%"
    example_shader_label = "Believe that the government should continue the block on onshore wind development"


class LandingPage14View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK — including the climate priorities across the nation. Which UK regions are acting on climate and where is the journey to net zero most advanced?"
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Support renewable energy projects in their local area"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "86%"
    example_shader_label = "Believe the government has increased investment in renewables over the past 5 years"


class LandingPage15View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK — including data on MPs across the UK. Which MPs are pro- and anti-climate measures? How have they voted on climate-related issues? What interests do they have and are they members of select committees or APPGs?"
    search_form_label = None
    meta_description = intro_text
    example_filter_label = (
        "MP signed The Climate Coalition’s 2019 Net Zero Target joint letter"
    )
    example_filter_comparator = "is"
    example_filter_value = "Signed"
    example_shader_label = "Believe that the government should continue the block on onshore wind development"


class LandingPage16View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK — including data on offshore and onshore windfarms, sustainable energy projects, where renewable energy is being generated, and how these intersect with other factors across the UK."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Believe that the government should use wind and solar farms to reduce energy bills"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "85%"
    example_shader_label = "Support offshore wind"


class LandingPage17View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets and how they intersect across the UK. You’ll find many useful datasets on wildlife, biodiversity, nature, habitat, conservation projects – and how they intersect with other crucial data like political strongholds and voting intention."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Number of Wildlife Trusts Reserves"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "3"
    example_shader_label = "Number of RSPB Reserves"


class LandingPage18View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets — including intel on which UK climate-interested groups and organisations are where. Find data on members and supporters of Friends of the Earth, the Women’s Institute, National Trust, and more. And see how they intersect with other factors like voting intention or degrees of deprivation."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Number of Friends of the Earth supporters"
    example_filter_comparator = "is equal or greater than"
    example_filter_value = "500"
    example_shader_label = "Considering voting for a different party in the next General Election to the one they voted for in 2019"


class LandingPage19View(BaseLandingPageView):
    page_title = (
        "Need to understand where your climate campaigns can have the greatest effect?"
    )
    intro_text = "Welcome to Local Intelligence Hub, a free tool for visualising different datasets — including information on flood risk, air quality, water pollution, sites of special scientific interest (SSSIs) and nature reserves. See these in combination with other vital UK data like voting intention and indices of deprivation and poverty."
    search_form_label = None
    meta_description = intro_text
    example_filter_label = "Index of Multiple Deprivation (IMD)"
    example_filter_comparator = "is less than"
    example_filter_value = "3"
    example_shader_label = "Flood risk from rivers or sea"


urlpatterns = [
    path("", LandingPageIndexView.as_view(), name="landing_page_index"),
    path(
        "climate-data-for-your-area/",
        LandingPage01View.as_view(),
        name="landing_page_01",
    ),
    path(
        "public-opinion-on-climate/",
        LandingPage02View.as_view(),
        name="landing_page_02",
    ),
    path(
        "demographics-for-your-area/",
        LandingPage03View.as_view(),
        name="landing_page_03",
    ),
    path(
        "real-time-data-flood-risk-air-quality/",
        LandingPage04View.as_view(),
        name="landing_page_04",
    ),
    path(
        "local-groups-organisations-area/",
        LandingPage05View.as_view(),
        name="landing_page_05",
    ),
    path("all-about-your-mp/", LandingPage06View.as_view(), name="landing_page_06"),
    path(
        "election-data-for-your-area/",
        LandingPage07View.as_view(),
        name="landing_page_07",
    ),
    path(
        "sustainable-energy-data-for-your-area/",
        LandingPage08View.as_view(),
        name="landing_page_08",
    ),
    path(
        "data-on-nature-for-your-area/",
        LandingPage09View.as_view(),
        name="landing_page_09",
    ),
    path(
        "make-the-case-for-climate/",
        LandingPage10View.as_view(),
        name="landing_page_10",
    ),
    path(
        "climate-campaign-insights/",
        LandingPage11View.as_view(),
        name="landing_page_11",
    ),
    path(
        "political-party-climate-views/",
        LandingPage12View.as_view(),
        name="landing_page_12",
    ),
    path(
        "uk-political-data-climate/",
        LandingPage13View.as_view(),
        name="landing_page_13",
    ),
    path(
        "climate-priorities-across-uk/",
        LandingPage14View.as_view(),
        name="landing_page_14",
    ),
    path("mp-climate-data-uk/", LandingPage15View.as_view(), name="landing_page_15"),
    path(
        "renewable-energy-data-uk/", LandingPage16View.as_view(), name="landing_page_16"
    ),
    path(
        "wildlife-biodiversity-data-uk/",
        LandingPage17View.as_view(),
        name="landing_page_17",
    ),
    path(
        "climate-groups-uk-data/", LandingPage18View.as_view(), name="landing_page_18"
    ),
    path(
        "environmental-risk-data-uk/",
        LandingPage19View.as_view(),
        name="landing_page_19",
    ),
]
